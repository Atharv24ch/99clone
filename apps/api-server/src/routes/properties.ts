import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, properties, propertyImages, savedProperties, users } from "@99acres/db";
import type { Property } from "@99acres/db";
import { eq, and, gte, lte, sql, desc, asc, ilike, isNull, inArray } from "drizzle-orm";

import { authGuard, adminGuard } from "../middleware/authGuard.js";
import { geoSearchService } from "../services/geoSearch.js";
import { searchIndexer } from "../services/searchIndexer.js";
import { defaultJobOptions, imageQueue, notificationQueue } from "../config/queues.js";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

import { publicMediaBase, s3, S3_BUCKET } from "../config/s3.js";

// ─── Enums (mirrors packages/db schema) ───────────────────────────────────────

const listingTypes = ["buy", "rent", "pg", "commercial_buy", "commercial_rent", "plot_buy", "plot_rent", "new_project"] as const;
const propertyTypes = ["apartment", "independent_house", "villa", "plot", "commercial_office", "commercial_shop", "warehouse", "pg_hostel", "farmhouse"] as const;
const furnishingStatuses = ["unfurnished", "semi_furnished", "fully_furnished"] as const;
const possessionStatuses = ["ready_to_move", "under_construction", "new_launch"] as const;
const facings = ["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"] as const;

// ─── Validation schemas ───────────────────────────────────────────────────────

const listPropertiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  listingType: z.enum(listingTypes).optional(),
  propertyType: z.enum(propertyTypes).optional(),
  city: z.string().trim().max(128).optional(),
  locality: z.string().trim().max(256).optional(),
  q: z.string().trim().max(256).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
  maxBedrooms: z.coerce.number().int().min(0).optional(),
  furnishingStatus: z.enum(furnishingStatuses).optional(),
  possessionStatus: z.enum(possessionStatuses).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "popular"]).default("newest"),
});

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  listingType: z.enum(listingTypes).optional(),
});

const createPropertySchema = z.object({
  title: z.string().trim().min(10).max(512),
  description: z.string().trim().max(5000).optional(),
  listingType: z.enum(listingTypes),
  propertyType: z.enum(propertyTypes),
  price: z.coerce.number().positive(),
  isNegotiable: z.boolean().optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  balconies: z.number().int().min(0).max(20).optional(),
  builtUpArea: z.coerce.number().positive().optional(),
  carpetArea: z.coerce.number().positive().optional(),
  plotArea: z.coerce.number().positive().optional(),
  address: z.string().trim().min(5).max(1000),
  locality: z.string().trim().min(2).max(256),
  city: z.string().trim().min(2).max(128),
  state: z.string().trim().min(2).max(128),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  furnishingStatus: z.enum(furnishingStatuses).optional(),
  possessionStatus: z.enum(possessionStatuses).optional(),
  floorNumber: z.number().int().min(-5).max(200).optional(),
  totalFloors: z.number().int().min(0).max(200).optional(),
  ageOfProperty: z.number().int().min(0).max(200).optional(),
  facing: z.enum(facings).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const statusSchema = z.object({
  status: z.enum(["active", "rejected", "sold", "rented", "archived", "pending_approval"]),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const registerImageSchema = z.object({
  s3Key: z.string().min(1).max(1024).regex(/^properties\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/),
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  isCoverImage: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert numeric form fields to the decimal strings Drizzle expects. */
function toColumns(data: z.infer<typeof updatePropertySchema>): Partial<typeof properties.$inferInsert> {
  const dec = (v: number | undefined) => (v === undefined ? undefined : String(v));
  const out: Partial<typeof properties.$inferInsert> = {
    ...data,
    price: dec(data.price),
    builtUpArea: dec(data.builtUpArea),
    carpetArea: dec(data.carpetArea),
    plotArea: dec(data.plotArea),
    latitude: dec(data.latitude),
    longitude: dec(data.longitude),
  };
  if (data.price !== undefined && data.builtUpArea) {
    out.pricePerSqFt = (data.price / data.builtUpArea).toFixed(2);
  }
  // Drop undefined keys so a partial update never nulls a column
  for (const key of Object.keys(out) as Array<keyof typeof out>) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const listColumns = {
  id: properties.id,
  slug: properties.slug,
  title: properties.title,
  listingType: properties.listingType,
  propertyType: properties.propertyType,
  status: properties.status,
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
  viewCount: properties.viewCount,
  leadCount: properties.leadCount,
  listedAt: properties.listedAt,
};

type ListRow = { id: string } & Record<string, unknown>;

/** Attach each listing's cover image (first by cover flag, then sort order). */
async function withCoverImages<T extends ListRow>(rows: T[]) {
  if (rows.length === 0) return rows.map((r) => ({ ...r, images: [] }));

  const images = await db
    .select({
      id: propertyImages.id,
      propertyId: propertyImages.propertyId,
      cdnUrl: propertyImages.cdnUrl,
      thumbnailUrl: propertyImages.thumbnailUrl,
      isCoverImage: propertyImages.isCoverImage,
      sortOrder: propertyImages.sortOrder,
    })
    .from(propertyImages)
    .where(inArray(propertyImages.propertyId, rows.map((r) => r.id)))
    .orderBy(desc(propertyImages.isCoverImage), asc(propertyImages.sortOrder));

  const cover = new Map<string, (typeof images)[number]>();
  for (const img of images) {
    if (!cover.has(img.propertyId)) cover.set(img.propertyId, img);
  }
  return rows.map((r) => {
    const img = cover.get(r.id);
    return { ...r, images: img ? [img] : [] };
  });
}

async function loadOwned(id: string, userId: string, role: string) {
  const [existing] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1);
  if (!existing) return { error: 404 as const };
  if (existing.ownerId !== userId && role !== "admin") return { error: 403 as const };
  return { property: existing };
}

function reindex(property: Property | undefined) {
  if (!property) return;
  const task = property.status === "active"
    ? searchIndexer.indexProperty(property)
    : searchIndexer.deleteProperty(property.id);
  void task.catch((err: unknown) => console.error("Search index sync failed:", err));
}

const uuidParam = z.object({ id: z.string().uuid() });

// ─── Route registration ───────────────────────────────────────────────────────

export async function propertiesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/properties
  fastify.get("/", async (request, reply) => {
    const query = listPropertiesSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Bad Request", message: query.error.issues[0]?.message ?? "Invalid query" });
    }

    const {
      page, limit, listingType, propertyType, city, locality, q,
      minPrice, maxPrice, minBedrooms, maxBedrooms,
      furnishingStatus, possessionStatus, verifiedOnly, sortBy,
    } = query.data;

    const offset = (page - 1) * limit;

    const conditions = [isNull(properties.deletedAt), eq(properties.status, "active")];

    if (listingType) conditions.push(eq(properties.listingType, listingType));
    if (propertyType) conditions.push(eq(properties.propertyType, propertyType));
    if (city) conditions.push(ilike(properties.city, `%${city}%`));
    if (locality) {
      // Free-text place search: match locality OR city so "Pune" and "Baner" both work
      conditions.push(sql`(${properties.locality} ILIKE ${`%${locality}%`} OR ${properties.city} ILIKE ${`%${locality}%`})`);
    }
    if (q) {
      conditions.push(sql`(${properties.title} ILIKE ${`%${q}%`} OR ${properties.locality} ILIKE ${`%${q}%`} OR ${properties.city} ILIKE ${`%${q}%`})`);
    }
    if (minPrice !== undefined) conditions.push(gte(properties.price, String(minPrice)));
    if (maxPrice !== undefined) conditions.push(lte(properties.price, String(maxPrice)));
    if (minBedrooms !== undefined) conditions.push(gte(properties.bedrooms, minBedrooms));
    if (maxBedrooms !== undefined) conditions.push(lte(properties.bedrooms, maxBedrooms));
    if (furnishingStatus) conditions.push(eq(properties.furnishingStatus, furnishingStatus));
    if (possessionStatus) conditions.push(eq(properties.possessionStatus, possessionStatus));
    if (verifiedOnly) conditions.push(eq(properties.isVerified, true));

    const orderBy =
      sortBy === "price_asc" ? [asc(properties.price)]
      : sortBy === "price_desc" ? [desc(properties.price)]
      : sortBy === "popular" ? [desc(properties.isFeatured), desc(properties.viewCount)]
      : [desc(properties.listedAt)];

    const [rows, countResult] = await Promise.all([
      db
        .select(listColumns)
        .from(properties)
        .where(and(...conditions))
        .orderBy(...orderBy, asc(properties.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return reply.send({
      data: await withCoverImages(rows),
      total,
      page,
      limit,
      hasMore: offset + rows.length < total,
    });
  });

  // GET /api/v1/properties/stats — public marketplace counters
  fastify.get("/stats", async (_request, reply) => {
    const [row] = await db
      .select({
        active: sql<number>`count(*)`,
        verified: sql<number>`count(*) filter (where ${properties.isVerified})`,
        cities: sql<number>`count(distinct lower(${properties.city}))`,
      })
      .from(properties)
      .where(and(isNull(properties.deletedAt), eq(properties.status, "active")));

    const byCity = await db
      .select({ city: properties.city, count: sql<number>`count(*)` })
      .from(properties)
      .where(and(isNull(properties.deletedAt), eq(properties.status, "active")))
      .groupBy(properties.city)
      .orderBy(sql`count(*) desc`)
      .limit(12);

    return reply.header("Cache-Control", "public, max-age=300").send({
      data: {
        activeListings: Number(row?.active ?? 0),
        verifiedListings: Number(row?.verified ?? 0),
        cities: Number(row?.cities ?? 0),
        byCity: byCity.map((c) => ({ city: c.city, count: Number(c.count) })),
      },
    });
  });

  // GET /api/v1/properties/nearby — radius search
  fastify.get("/nearby", async (request, reply) => {
    const query = nearbySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Bad Request", message: query.error.issues[0]?.message ?? "Invalid query" });
    }

    const results = await geoSearchService.findNearby(query.data);
    return reply.send({ data: results, total: results.length });
  });

  // GET /api/v1/properties/mine — the current user's listings (any status)
  fastify.get("/mine", { preHandler: [authGuard] }, async (request, reply) => {
    const rows = await db
      .select({ ...listColumns, createdAt: properties.createdAt })
      .from(properties)
      .where(and(eq(properties.ownerId, request.user.sub), isNull(properties.deletedAt)))
      .orderBy(desc(properties.createdAt))
      .limit(200);

    return reply.send({ data: await withCoverImages(rows) });
  });

  // GET /api/v1/properties/pending — moderation queue (admin)
  fastify.get("/pending", { preHandler: [authGuard, adminGuard] }, async (_request, reply) => {
    const rows = await db
      .select({ ...listColumns, ownerId: properties.ownerId, createdAt: properties.createdAt })
      .from(properties)
      .where(and(eq(properties.status, "pending_approval"), isNull(properties.deletedAt)))
      .orderBy(asc(properties.createdAt))
      .limit(100);

    return reply.send({ data: await withCoverImages(rows) });
  });

  // GET /api/v1/properties/saved — the current user's saved listings
  fastify.get("/saved", { preHandler: [authGuard] }, async (request, reply) => {
    const rows = await db
      .select({ ...listColumns, savedAt: savedProperties.savedAt })
      .from(savedProperties)
      .innerJoin(properties, eq(savedProperties.propertyId, properties.id))
      .where(and(eq(savedProperties.userId, request.user.sub), isNull(properties.deletedAt)))
      .orderBy(desc(savedProperties.savedAt))
      .limit(200);

    return reply.send({ data: await withCoverImages(rows) });
  });

  // GET /api/v1/properties/saved/ids — ids only, for toggling save buttons
  fastify.get("/saved/ids", { preHandler: [authGuard] }, async (request, reply) => {
    const rows = await db
      .select({ propertyId: savedProperties.propertyId })
      .from(savedProperties)
      .where(eq(savedProperties.userId, request.user.sub));
    return reply.send({ data: rows.map((r) => r.propertyId) });
  });

  // PUT /api/v1/properties/:id/save — save a listing (idempotent)
  fastify.put<{ Params: { id: string } }>("/:id/save", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    const [exists] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, params.data.id), isNull(properties.deletedAt)))
      .limit(1);
    if (!exists) return reply.status(404).send({ error: "Not Found", message: "Property not found" });

    const [already] = await db
      .select({ id: savedProperties.id })
      .from(savedProperties)
      .where(and(eq(savedProperties.userId, request.user.sub), eq(savedProperties.propertyId, params.data.id)))
      .limit(1);
    if (!already) {
      await db.insert(savedProperties).values({ userId: request.user.sub, propertyId: params.data.id });
    }
    return reply.status(204).send();
  });

  // DELETE /api/v1/properties/:id/save — unsave a listing
  fastify.delete<{ Params: { id: string } }>("/:id/save", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    await db
      .delete(savedProperties)
      .where(and(eq(savedProperties.userId, request.user.sub), eq(savedProperties.propertyId, params.data.id)));
    return reply.status(204).send();
  });

  // GET /api/v1/properties/slug/:slug — for the SSR detail page
  fastify.get<{ Params: { slug: string } }>("/slug/:slug", async (request, reply) => {
    const { slug } = request.params;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.slug, slug), isNull(properties.deletedAt)))
      .limit(1);

    if (!property || property.status !== "active") {
      return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, property.id))
      .orderBy(desc(propertyImages.isCoverImage), asc(propertyImages.sortOrder));

    // Count the view (fire-and-forget)
    void db
      .update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.id, property.id))
      .catch((err: unknown) => console.error("View count update failed:", err));

    return reply.send({ data: { ...property, images } });
  });

  // GET /api/v1/properties/:id
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });
    const { id } = params.data;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
      .limit(1);

    if (!property) {
      return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    // Unpublished listings are visible only to their owner or an admin
    if (property.status !== "active") {
      let allowed = false;
      try {
        await request.jwtVerify();
        allowed = request.user.sub === property.ownerId || request.user.role === "admin";
      } catch {
        allowed = false;
      }
      if (!allowed) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id))
      .orderBy(desc(propertyImages.isCoverImage), asc(propertyImages.sortOrder));

    return reply.send({ data: { ...property, images } });
  });

  // POST /api/v1/properties — create listing (auth required)
  fastify.post("/", { preHandler: [authGuard] }, async (request, reply) => {
    const body = createPropertySchema.safeParse(request.body);
    if (!body.success) {
      const issue = body.error.issues[0];
      return reply.status(400).send({
        error: "Validation Error",
        message: issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "Invalid input",
      });
    }

    const data = body.data;
    const slugBase = slugify(
      [
        data.bedrooms ? `${data.bedrooms}bhk` : "",
        data.propertyType.replace(/_/g, "-"),
        "in",
        data.locality,
        data.city,
      ].filter(Boolean).join(" ")
    );
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

    const [created] = await db
      .insert(properties)
      .values({
        ...(toColumns(data) as typeof properties.$inferInsert),
        slug,
        ownerId: request.user.sub,
        status: "pending_approval",
      })
      .returning();

    return reply.status(201).send({ data: created });
  });

  // PUT /api/v1/properties/:id — edit own listing
  fastify.put<{ Params: { id: string } }>("/:id", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    const owned = await loadOwned(params.data.id, request.user.sub, request.user.role);
    if (owned.error === 404) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    if (owned.error === 403) return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });

    const body = updatePropertySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
    }

    const updateData = toColumns(body.data);
    // Recompute price/sqft when only one side changes
    const price = body.data.price ?? Number(owned.property.price);
    const area = body.data.builtUpArea ?? (owned.property.builtUpArea ? Number(owned.property.builtUpArea) : undefined);
    if (area) updateData.pricePerSqFt = (price / area).toFixed(2);

    if (Object.keys(updateData).length === 0) {
      return reply.send({ data: owned.property });
    }

    const [updated] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, params.data.id))
      .returning();

    reindex(updated);
    return reply.send({ data: updated });
  });

  // PATCH /api/v1/properties/:id/status — moderation & lifecycle
  fastify.patch<{ Params: { id: string } }>("/:id/status", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    const body = statusSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
    }

    const owned = await loadOwned(params.data.id, request.user.sub, request.user.role);
    if (owned.error === 404) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    if (owned.error === 403) return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });

    const isAdmin = request.user.role === "admin";
    const { status, isVerified, isFeatured } = body.data;

    // Owners may only close out their own listings; publishing and badges are admin-only
    if (!isAdmin && (!["sold", "rented", "archived"].includes(status) || isVerified !== undefined || isFeatured !== undefined)) {
      return reply.status(403).send({ error: "Forbidden", message: "Only moderators can publish or badge listings" });
    }

    const [updated] = await db
      .update(properties)
      .set({
        status,
        ...(isVerified !== undefined ? { isVerified } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(status === "active" && owned.property.status !== "active" ? { listedAt: new Date() } : {}),
      })
      .where(eq(properties.id, params.data.id))
      .returning();

    reindex(updated);

    // Tell the owner their listing went live
    if (status === "active" && owned.property.status !== "active") {
      void (async () => {
        const [owner] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, owned.property.ownerId))
          .limit(1);
        if (!owner?.email) return;
        await notificationQueue.add(
          "listing-approved",
          {
            type: "property_approved",
            userEmail: owner.email,
            propertyId: owned.property.id,
            message: `"${owned.property.title}" has been approved and now appears in search.`,
          },
          defaultJobOptions
        );
      })().catch((err: unknown) => console.error("Failed to queue approval email:", err));
    }

    return reply.send({ data: updated });
  });

  // POST /api/v1/properties/:id/images — register an uploaded photo and queue processing
  fastify.post<{ Params: { id: string } }>("/:id/images", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    const owned = await loadOwned(params.data.id, request.user.sub, request.user.role);
    if (owned.error === 404) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    if (owned.error === 403) return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });

    const body = registerImageSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
    }
    if (!body.data.s3Key.startsWith(`properties/${params.data.id}/`)) {
      return reply.status(400).send({ error: "Bad Request", message: "Image does not belong to this listing" });
    }

    // The browser uploads straight to storage; confirm the object really landed
    let head;
    try {
      head = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: body.data.s3Key }));
    } catch {
      return reply.status(400).send({ error: "Bad Request", message: "That photo hasn't finished uploading. Please try again." });
    }
    if ((head.ContentLength ?? 0) > 10 * 1024 * 1024) {
      return reply.status(400).send({ error: "Bad Request", message: "Photos must be 10 MB or smaller" });
    }
    if (head.ContentType && !head.ContentType.startsWith("image/")) {
      return reply.status(400).send({ error: "Bad Request", message: "Only image files can be added" });
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, params.data.id));
    const existingCount = Number(countRow?.count ?? 0);
    if (existingCount >= 20) {
      return reply.status(409).send({ error: "Conflict", message: "A listing can have at most 20 photos" });
    }

    const [image] = await db
      .insert(propertyImages)
      .values({
        propertyId: params.data.id,
        s3Key: body.data.s3Key,
        cdnUrl: `${publicMediaBase()}/${body.data.s3Key}`,
        mimeType: body.data.mimeType,
        sizeBytes: head.ContentLength ?? body.data.sizeBytes ?? null,
        isCoverImage: body.data.isCoverImage ?? existingCount === 0,
        sortOrder: existingCount,
      })
      .returning();

    if (image) {
      void imageQueue
        .add("process", { imageId: image.id, s3Key: image.s3Key, propertyId: params.data.id }, defaultJobOptions)
        .catch((err: unknown) => console.error("Failed to queue image processing:", err));
    }

    return reply.status(201).send({ data: image });
  });

  // DELETE /api/v1/properties/:id — soft delete
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: [authGuard] }, async (request, reply) => {
    const params = uuidParam.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Bad Request", message: "Invalid property id" });

    const owned = await loadOwned(params.data.id, request.user.sub, request.user.role);
    if (owned.error === 404) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    if (owned.error === 403) return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });

    await db
      .update(properties)
      .set({ deletedAt: new Date(), status: "archived" })
      .where(eq(properties.id, params.data.id));

    void searchIndexer.deleteProperty(params.data.id).catch((err: unknown) => console.error(err));

    return reply.status(204).send();
  });
}
