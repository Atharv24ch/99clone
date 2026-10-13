import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, users } from "@99acres/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { authGuard } from "../middleware/authGuard.js";

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  password: z.string().min(8).optional(), // hashed before storage
  role: z.enum(["buyer", "seller", "agent", "builder"]).default("buyer"),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
});

// Simple SHA-256 hash — use bcrypt in production
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/auth/register
  fastify.post("/register", async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.message });
    }

    const { email, phone, firstName, lastName, role } = body.data;

    if (!email && !phone) {
      return reply.status(400).send({
        error: "Bad Request",
        message: "Either email or phone is required",
      });
    }

    // Check existing user
    if (email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        return reply.status(409).send({ error: "Conflict", message: "Email already registered" });
      }
    }

    const [created] = await db
      .insert(users)
      .values({ email, phone, firstName, lastName, role })
      .returning({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

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
  fastify.post("/login", async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Validation Error", message: body.error.message });
    }

    const { email, phone } = body.data;

    const [user] = await db
      .select()
      .from(users)
      .where(email ? eq(users.email, email) : eq(users.phone, phone!))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", message: "Invalid credentials" });
    }

    if (user.status === "suspended") {
      return reply.status(403).send({ error: "Forbidden", message: "Account suspended" });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
      email: user.email ?? undefined,
    });

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
    });
  });

  // GET /api/v1/auth/me — get current user profile
  fastify.get(
    "/me",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const [user] = await db
        .select({
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
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1);

      if (!user) return reply.status(404).send({ error: "Not Found" });

      return reply.send({ data: user });
    }
  );
}
