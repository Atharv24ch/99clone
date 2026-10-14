import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";

const DEV_SECRET = "super-secret-dev-key-change-in-production";

function resolveJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (process.env["NODE_ENV"] === "production") {
    if (!secret || secret.length < 32 || secret.startsWith("change-me")) {
      throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production");
    }
    return secret;
  }
  return secret ?? DEV_SECRET;
}

/**
 * Registers @fastify/jwt. Routes are protected with `authGuard`
 * from middleware/authGuard.ts.
 */
async function auth(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: resolveJwtSecret(),
    sign: {
      expiresIn: process.env["JWT_EXPIRY"] ?? "7d",
    },
  });
}

// fastify-plugin exposes request.jwtVerify / reply.jwtSign to every route
export const authPlugin = fp(auth, { name: "auth" });
