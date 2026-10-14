import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, users, properties, leads, savedProperties } from "@99acres/db";
import { and, eq, isNull, sql } from "drizzle-orm";

import { authGuard } from "../middleware/authGuard.js";
import { hashPassword, verifyPassword } from "../services/password.js";

// ─── Validation schemas ───────────────────────────────────────────────────────

const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;

const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().regex(phoneRegex, "Invalid phone number").optional(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional(),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    // Admin cannot be self-assigned
    role: z.enum(["buyer", "seller", "agent", "builder"]).default("buyer"),
  })
  .refine((d) => d.email || d.phone, { message: "Either email or phone is required" });

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(1).max(128),
  })
  .refine((d) => d.email || d.phone, { message: "Either email or phone is required" });

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().regex(phoneRegex, "Invalid phone number").nullable().optional(),
  agencyName: z.string().trim().max(256).nullable().optional(),
  reraNumber: z.string().trim().max(64).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
});

const publicUserColumns = {
  id: users.id,
  email: users.email,
  phone: users.phone,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  avatarUrl: users.avatarUrl,
  isPhoneVerified: users.isPhoneVerified,
  isEmailVerified: users.isEmailVerified,
  reraNumber: users.reraNumber,
  agencyName: users.agencyName,
  bio: users.bio,
  createdAt: users.createdAt,
};

// Tighter limit than the global one for credential endpoints
const authRateLimit = { rateLimit: { max: 10, timeWindow: "1 minute" } };

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/auth/register
  fastify.post("/register", { config: authRateLimit }, async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: body.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { email, phone, firstName, lastName, password, role } = body.data;

    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        email && phone
          ? sql`${users.email} = ${email} OR ${users.phone} = ${phone}`
          : email
            ? eq(users.email, email)
            : eq(users.phone, phone!)
      )
      .limit(1);

    if (existing) {
      return reply.status(409).send({
        error: "Conflict",
        message: existing.email === email ? "Email already registered" : "Phone number already registered",
      });
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({ email, phone, firstName, lastName, role, passwordHash })
      .returning(publicUserColumns);

    if (!created) {
      return reply.status(500).send({ error: "Internal Server Error" });
    }

    const token = await reply.jwtSign({
      sub: created.id,
      role: created.role,
      email: created.email ?? undefined,
    });

    return reply.status(201).send({ data: { user: created, token } });
  });

  // POST /api/v1/auth/login
  fastify.post("/login", { config: authRateLimit }, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: body.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { email, phone, password } = body.data;

    const [user] = await db
      .select()
      .from(users)
      .where(and(email ? eq(users.email, email) : eq(users.phone, phone!), isNull(users.deletedAt)))
      .limit(1);

    // Same message for unknown user and wrong password to avoid account enumeration
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return reply.status(401).send({ error: "Unauthorized", message: "Incorrect email or password" });
    }

    if (user.status === "suspended") {
      return reply.status(403).send({ error: "Forbidden", message: "This account has been suspended" });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
      email: user.email ?? undefined,
    });

    const { passwordHash: _omit, deletedAt: _d, updatedAt: _u, status: _s, ...safeUser } = user;
    return reply.send({ data: { user: safeUser, token } });
  });

  // GET /api/v1/auth/me — current user profile
  fastify.get("/me", { preHandler: [authGuard] }, async (request, reply) => {
    const [user] = await db
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, request.user.sub))
      .limit(1);

    if (!user) return reply.status(404).send({ error: "Not Found", message: "User not found" });

    return reply.send({ data: user });
  });

  // PATCH /api/v1/auth/me — update own profile
  fastify.patch("/me", { preHandler: [authGuard] }, async (request, reply) => {
    const body = updateProfileSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: "Validation Error",
        message: body.error.issues[0]?.message ?? "Invalid input",
      });
    }

    if (body.data.phone) {
      const [taken] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.phone, body.data.phone), sql`${users.id} <> ${request.user.sub}`))
        .limit(1);
      if (taken) {
        return reply.status(409).send({ error: "Conflict", message: "Phone number already in use" });
      }
    }

    const [updated] = await db
      .update(users)
      .set(body.data)
      .where(eq(users.id, request.user.sub))
      .returning(publicUserColumns);

    return reply.send({ data: updated });
  });

  // GET /api/v1/auth/me/stats — dashboard counters for the current user
  fastify.get("/me/stats", { preHandler: [authGuard] }, async (request, reply) => {
    const userId = request.user.sub;

    const [listingStats, leadStats, savedStats] = await Promise.all([
      db
        .select({
          active: sql<number>`count(*) filter (where ${properties.status} = 'active')`,
          pending: sql<number>`count(*) filter (where ${properties.status} = 'pending_approval')`,
          total: sql<number>`count(*)`,
          views: sql<number>`coalesce(sum(${properties.viewCount}), 0)`,
        })
        .from(properties)
        .where(and(eq(properties.ownerId, userId), isNull(properties.deletedAt))),
      db
        .select({
          total: sql<number>`count(*)`,
          fresh: sql<number>`count(*) filter (where ${leads.status} = 'new')`,
        })
        .from(leads)
        .where(eq(leads.ownerId, userId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(savedProperties)
        .where(eq(savedProperties.userId, userId)),
    ]);

    return reply.send({
      data: {
        activeListings: Number(listingStats[0]?.active ?? 0),
        pendingListings: Number(listingStats[0]?.pending ?? 0),
        totalListings: Number(listingStats[0]?.total ?? 0),
        totalViews: Number(listingStats[0]?.views ?? 0),
        totalLeads: Number(leadStats[0]?.total ?? 0),
        newLeads: Number(leadStats[0]?.fresh ?? 0),
        savedProperties: Number(savedStats[0]?.total ?? 0),
      },
    });
  });
}
