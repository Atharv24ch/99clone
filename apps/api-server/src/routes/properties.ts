import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, properties, propertyImages, users } from "@99acres/db";
import { eq, and, gte, lte, sql, desc, asc, ilike, isNull } from "drizzle-orm";

import { authGuard } from "../middleware/authGuard.js";
import { geoSearchService } from "../services/geoSearch.js";
import { searchIndexer } from "../services/searchIndexer.js";

// ─── Validation schemas ───────────────────────────────────────────────────────

const listPropertiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  listingType: z.string().optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  maxBedrooms: z.coerce.number().optional(),
  furnishingStatus: z.string().optional(),
  possessionStatus: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "popular"]).default("newest"),
});

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  listingType: z.string().optional(),
});

const createPropertySchema = z.object({
  title: z.string().min(10).max(512),
  description: z.string().optional(),
  listingType: z.enum(["buy", "rent", "pg", "commercial_buy", "commercial_rent", "plot_buy", "plot_rent", "new_project"]),
  propertyType: z.enum(["apartment", "independent_house", "villa", "plot", "commercial_office", "commercial_shop", "warehouse", "pg_hostel", "farmhouse"]),
  price: z.number().positive(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  builtUpArea: z.number().positive().optional(),
  carpetArea: z.number().positive().optional(),
  address: z.string().min(5),
  locality: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  furnishingStatus: z.enum(["unfurnished", "semi_furnished", "fully_furnished"]).optional(),
  possessionStatus: z.enum(["ready_to_move", "under_construction", "new_launch"]).optional(),
  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  facing: z.enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]).optional(),
});

// ─── Route registration ───────────────────────────────────────────────────────

export async function propertiesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/properties
  fastify.get("/", async (request, reply) => {
    const query = listPropertiesSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Bad Request", message: query.error.message });
    }

    const {
      page, limit, listingType, propertyType, city, locality,
      minPrice, maxPrice, minBedrooms, maxBedrooms,
      furnishingStatus, possessionStatus, sortBy,
    } = query.data;

    const offset = (page - 1) * limit;

    const conditions = [isNull(properties.deletedAt), eq(properties.status, "active")];

    if (listingType) conditions.push(eq(properties.listingType, listingType as "buy" | "rent"));
    if (propertyType) conditions.push(eq(properties.propertyType, propertyType as "apartment"));
    if (city) conditions.push(ilike(properties.city, `%${city}%`));
    if (locality) conditions.push(ilike(properties.locality, `%${locality}%`));
    if (minPrice) conditions.push(gte(properties.price, String(minPrice)));
    if (maxPrice) conditions.push(lte(properties.price, String(maxPrice)));
    if (minBedrooms) conditions.push(gte(properties.bedrooms, minBedrooms));
    if (maxBedrooms) conditions.push(lte(properties.bedrooms, maxBedrooms));
    if (furnishingStatus) conditions.push(eq(properties.furnishingStatus, furnishingStatus as "unfurnished"));
    if (possessionStatus) conditions.push(eq(properties.possessionStatus, possessionStatus as "ready_to_move"));

    const orderBy =
      sortBy === "price_asc" ? asc(properties.price)
      : sortBy === "price_desc" ? desc(properties.price)
      : sortBy === "popular" ? desc(properties.viewCount)
      : desc(properties.listedAt);

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: properties.id,
          slug: properties.slug,
          title: properties.title,
          listingType: properties.listingType,
          propertyType: properties.propertyType,
          price: properties.price,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          builtUpArea: properties.builtUpArea,
          locality: properties.locality,
          city: properties.city,
          latitude: properties.latitude,
          longitude: properties.longitude,
          isVerified: properties.isVerified,
          isFeatured: properties.isFeatured,
          furnishingStatus: properties.furnishingStatus,
          possessionStatus: properties.possessionStatus,
          listedAt: properties.listedAt,
        })
        .from(properties)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return reply.send({
      data: rows,
      total,
      page,
      limit,
      hasMore: offset + rows.length < total,
    });
  });

  // GET /api/v1/properties/nearby — PostGIS radius search
  fastify.get("/nearby", async (request, reply) => {
    const query = nearbySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Bad Request", message: query.error.message });
    }

    const results = await geoSearchService.findNearby(query.data);
    return reply.send({ data: results, total: results.length });
  });

  // GET /api/v1/properties/:id
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
      .limit(1);

    if (!property) {
      return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    // Fetch images
    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id))
      .orderBy(asc(propertyImages.sortOrder));

    // Increment view count (fire-and-forget)
    void db
      .update(properties)
      .set({ viewCount: sql`view_count + 1` })
      .where(eq(properties.id, id));

    return reply.send({ data: { ...property, images } });
  });

  // GET /api/v1/properties/slug/:slug — for SSR page
  fastify.get<{ Params: { slug: string } }>("/slug/:slug", async (request, reply) => {
    const { slug } = request.params;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.slug, slug), isNull(properties.deletedAt)))
      .limit(1);

    if (!property) {
      return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, property.id))
      .orderBy(asc(propertyImages.sortOrder));

    return reply.send({ data: { ...property, images } });
  });

  // POST /api/v1/properties — create listing (auth required)
  fastify.post(
    "/",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const body = createPropertySchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.message });
      }

      const user = request.user;
      const data = body.data;

      // Generate slug
      const slugBase = `${data.bedrooms ?? ""}bhk-${data.propertyType.replace(/_/g, "-")}-in-${data.locality.toLowerCase().replace(/\s+/g, "-")}-${data.city.toLowerCase().replace(/\s+/g, "-")}`;
      const suffix = Math.random().toString(36).slice(2, 8);
      const slug = `${slugBase}-${suffix}`;

      const [created] = await db
        .insert(properties)
        .values({
          slug,
          title: data.title,
          description: data.description ?? null,
          listingType: data.listingType,
          propertyType: data.propertyType,
          ownerId: user.sub,
          price: String(data.price),
          bedrooms: data.bedrooms ?? null,
          bathrooms: data.bathrooms ?? null,
          builtUpArea: data.builtUpArea !== undefined ? String(data.builtUpArea) : null,
          carpetArea: data.carpetArea !== undefined ? String(data.carpetArea) : null,
          address: data.address,
          locality: data.locality,
          city: data.city,
          state: data.state,
          pincode: data.pincode ?? null,
          latitude: data.latitude !== undefined ? String(data.latitude) : null,
          longitude: data.longitude !== undefined ? String(data.longitude) : null,
          furnishingStatus: data.furnishingStatus ?? null,
          possessionStatus: data.possessionStatus ?? null,
          floorNumber: data.floorNumber ?? null,
          totalFloors: data.totalFloors ?? null,
          facing: data.facing ?? null,
          status: "pending_approval",
        })
        .returning();

      // Index in OpenSearch asynchronously
      if (created) {
        void searchIndexer.indexProperty(created).catch(console.error);
      }

      return reply.status(201).send({ data: created });
    }
  );

  // PUT /api/v1/properties/:id
  fastify.put<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;

      const [existing] = await db
        .select({ id: properties.id, ownerId: properties.ownerId })
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!existing) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
      if (existing.ownerId !== user.sub && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });
      }

      const body = createPropertySchema.partial().safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.message });
      }

      const updateData: Partial<typeof properties.$inferInsert> = {};
      if (body.data.title) updateData.title = body.data.title;
      if (body.data.description) updateData.description = body.data.description;
      if (body.data.price) updateData.price = String(body.data.price);
      if (body.data.bedrooms !== undefined) updateData.bedrooms = body.data.bedrooms;
      if (body.data.bathrooms !== undefined) updateData.bathrooms = body.data.bathrooms;

      const [updated] = await db
        .update(properties)
        .set(updateData)
        .where(eq(properties.id, id))
        .returning();

      return reply.send({ data: updated });
    }
  );

  // DELETE /api/v1/properties/:id — soft delete
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;

      const [existing] = await db
        .select({ ownerId: properties.ownerId })
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!existing) return reply.status(404).send({ error: "Not Found" });
      if (existing.ownerId !== user.sub && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      await db
        .update(properties)
        .set({ deletedAt: new Date(), status: "archived" })
        .where(eq(properties.id, id));

      // Remove from search index
      void searchIndexer.deleteProperty(id).catch(console.error);

      return reply.status(204).send();
    }
  );
}
