import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, leads, properties } from "@99acres/db";
import { eq, and, desc, isNull } from "drizzle-orm";

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

const updateLeadStatusSchema = z.object({
  status: z.enum(["new", "contacted", "visited", "negotiating", "converted", "lost", "spam"]),
  notes: z.string().max(2000).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function leadsRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/leads — submit buyer enquiry (public)
  fastify.post("/", async (request, reply) => {
    const body = createLeadSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.message });
    }

    const { propertyId, name, phone, email, message, source } = body.data;

    // Verify property exists
    const [property] = await db
      .select({ id: properties.id, ownerId: properties.ownerId })
      .from(properties)
      .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
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
      const user = request.user;
      const { page = "1", limit = "20", status } = request.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      const conditions = [eq(leads.ownerId, user.sub)];
      if (status) {
        conditions.push(eq(leads.status, status as "new" | "contacted"));
      }

      const rows = await db
        .select()
        .from(leads)
        .where(and(...conditions))
        .orderBy(desc(leads.createdAt))
        .limit(limitNum)
        .offset(offset);

      return reply.send({ data: rows, page: pageNum, limit: limitNum });
    }
  );

  // GET /api/v1/leads/:id
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user;

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

      const [lead] = await db
        .select({ ownerId: leads.ownerId, assignedTo: leads.assignedTo })
        .from(leads)
        .where(eq(leads.id, id))
        .limit(1);

      if (!lead) return reply.status(404).send({ error: "Not Found" });
      const canUpdate = lead.ownerId === user.sub || lead.assignedTo === user.sub || user.role === "admin";
      if (!canUpdate) return reply.status(403).send({ error: "Forbidden" });

      const body = updateLeadStatusSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.message });
      }

      const [updated] = await db
        .update(leads)
        .set({
          status: body.data.status,
          notes: body.data.notes,
          firstContactAt:
            body.data.status === "contacted" ? new Date() : undefined,
        })
        .where(eq(leads.id, id))
        .returning();

      return reply.send({ data: updated });
    }
  );
}
