import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";

/**
 * Registers FastifyJWT plugin.
 * After registration, use `fastify.authenticate` hook to protect routes.
 */
export async function authPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: process.env["JWT_SECRET"] ?? "super-secret-dev-key-change-in-production",
    sign: {
      expiresIn: process.env["JWT_EXPIRY"] ?? "7d",
    },
  });

  // Decorate with authenticate helper
  fastify.decorate(
    "authenticate",
    async function (request: Parameters<typeof fastify.authenticate>[0], reply: Parameters<typeof fastify.authenticate>[1]) {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
      }
    }
  );
}
