import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, leads, properties } from "@99acres/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

import { authGuard } from "../middleware/authGuard.js";
import { leadRouterService } from "../services/leadRouter.js";

// ─── Validation schemas ───────────────────────────────────────────────────────

const createLeadSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(2).max(256),
  phone: z.string().regex(/^\+?[\d\s\-()]{8,20}$/),
  email: z.string().email().optional(),
  message: z.string().max(1000).optional(),
  source: z
    .enum(["property_page", "search_results", "map_view", "featured_ad", "organic", "whatsapp", "phone"])
    .default("property_page"),
});

const leadStatuses = ["new", "contacted", "visited", "negotiating", "converted", "lost", "spam"] as const;

const listLeadsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(leadStatuses).optional(),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(leadStatuses),
  notes: z.string().max(2000).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function leadsRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/leads — submit buyer enquiry (public)
  fastify.post("/", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const body = createLeadSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
    }

    const { propertyId, name, phone, email, message, source } = body.data;

    // Verify property exists
    const [property] = await db
      .select({ id: properties.id, ownerId: properties.ownerId })
      .from(properties)
      .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt), eq(properties.status, "active")))
      .limit(1);

    if (!property) {
      return reply.status(404).send({ error: "Not Found", message: "Property not found" });
    }

    // Get buyer ID if authenticated
    let buyerId: string | undefined;
    try {
      await request.jwtVerify();
      buyerId = request.user.sub;
    } catch {
      // Anonymous lead — acceptable
    }

    const [created] = await db
      .insert(leads)
      .values({
        propertyId,
        ownerId: property.ownerId,
        buyerId,
        name,
        phone,
        email,
        message,
        source,
        status: "new",
      })
      .returning();

    if (created) {
      // Async: route lead to agent, send notification
      void leadRouterService.routeLead(created).catch(console.error);
    }

    return reply.status(201).send({
      data: { id: created?.id, message: "Enquiry submitted successfully" },
    });
  });

  // GET /api/v1/leads — agent/seller fetches their leads
  fastify.get(
    "/",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const query = listLeadsSchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({ error: "Bad Request", message: query.error.issues[0]?.message ?? "Invalid query" });
      }
      const { page, limit, status } = query.data;
      const offset = (page - 1) * limit;

      const conditions = [eq(leads.ownerId, request.user.sub)];
      if (status) conditions.push(eq(leads.status, status));

      const [rows, countResult] = await Promise.all([
        db
          .select({
            id: leads.id,
            propertyId: leads.propertyId,
            name: leads.name,
            phone: leads.phone,
            email: leads.email,
            message: leads.message,
            status: leads.status,
            source: leads.source,
            notes: leads.notes,
            createdAt: leads.createdAt,
            firstContactAt: leads.firstContactAt,
            propertyTitle: properties.title,
            propertySlug: properties.slug,
            propertyLocality: properties.locality,
            propertyCity: properties.city,
          })
          .from(leads)
          .innerJoin(properties, eq(leads.propertyId, properties.id))
          .where(and(...conditions))
          .orderBy(desc(leads.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(leads).where(and(...conditions)),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      return reply.send({ data: rows, total, page, limit, hasMore: offset + rows.length < total });
    }
  );

  // GET /api/v1/leads/:id
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;
      if (!z.string().uuid().safeParse(id).success) return reply.status(400).send({ error: "Bad Request", message: "Invalid lead id" });

      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, id))
        .limit(1);

      if (!lead) return reply.status(404).send({ error: "Not Found" });
      if (lead.ownerId !== user.sub && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return reply.send({ data: lead });
    }
  );

  // PATCH /api/v1/leads/:id/status
  fastify.patch<{ Params: { id: string } }>(
    "/:id/status",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;
      if (!z.string().uuid().safeParse(id).success) return reply.status(400).send({ error: "Bad Request", message: "Invalid lead id" });

      const [lead] = await db
        .select({ ownerId: leads.ownerId, assignedTo: leads.assignedTo, firstContactAt: leads.firstContactAt })
        .from(leads)
        .where(eq(leads.id, id))
        .limit(1);

      if (!lead) return reply.status(404).send({ error: "Not Found" });
      const canUpdate = lead.ownerId === user.sub || lead.assignedTo === user.sub || user.role === "admin";
      if (!canUpdate) return reply.status(403).send({ error: "Forbidden" });

      const body = updateLeadStatusSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
      }

      const [updated] = await db
        .update(leads)
        .set({
          status: body.data.status,
          notes: body.data.notes,
          ...(body.data.status === "contacted" && !lead.firstContactAt ? { firstContactAt: new Date() } : {}),
        })
        .where(eq(leads.id, id))
        .returning();

      return reply.send({ data: updated });
    }
  );
}
