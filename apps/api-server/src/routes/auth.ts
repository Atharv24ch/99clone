import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, users, properties, leads, savedProperties, passwordResetTokens } from "@99acres/db";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

import { authGuard } from "../middleware/authGuard.js";
import { hashPassword, verifyPassword } from "../services/password.js";
import { appUrl, emailLayout, sendEmail } from "../services/email.js";

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

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });

const resetSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This reset link is invalid"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const RESET_TTL_MS = 30 * 60 * 1000;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

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

  // POST /api/v1/auth/forgot-password — email a single-use reset link.
  // Always answers the same way so it can't be used to discover accounts.
  fastify.post("/forgot-password", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const body = forgotSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: "Enter a valid email address" });
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName, status: users.status })
      .from(users)
      .where(and(eq(users.email, body.data.email), isNull(users.deletedAt)))
      .limit(1);

    if (user?.email && user.status !== "suspended") {
      const token = randomBytes(32).toString("base64url");
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });

      const link = `${appUrl()}/reset-password?token=${token}`;
      void sendEmail({
        to: user.email,
        subject: "Reset your Aangan password",
        text: `Hi ${user.firstName}, use this link within 30 minutes to set a new password: ${link}
If you didn't ask for this, ignore this email.`,
        html: emailLayout(
          "Reset your password",
          `<p>Use the button below within 30 minutes to choose a new password.</p>
           <p><a href="${link}" style="display:inline-block;background:#5B2D8E;color:#fff;padding:10px 20px;text-decoration:none">Set a new password</a></p>
           <p style="color:#4A564E;font-size:13px">If you didn't ask for this, you can ignore this email; your password stays the same.</p>`
        ),
      }).catch((err: unknown) => request.log.error({ err }, "Password reset email failed"));
    }

    return reply.send({ data: { message: "If an account exists for that email, a reset link is on its way." } });
  });

  // POST /api/v1/auth/reset-password — set a new password with a valid token
  fastify.post("/reset-password", { config: authRateLimit }, async (request, reply) => {
    const body = resetSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
    }

    const [record] = await db
      .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, sha256(body.data.token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return reply.status(400).send({ error: "Bad Request", message: "This reset link has expired or was already used. Request a new one." });
    }

    const passwordHash = await hashPassword(body.data.password);
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
      // Burn this token and any other outstanding ones for the account
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, record.userId), isNull(passwordResetTokens.usedAt)));
    });

    return reply.send({ data: { message: "Password updated. You can sign in now." } });
  });
}
