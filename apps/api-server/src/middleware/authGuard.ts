import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Route pre-handler that verifies the JWT and populates request.user.
 * Usage: `{ preHandler: [authGuard] }` on protected routes.
 */
export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    // Returning the reply stops Fastify from running the route handler
    return reply.status(401).send({
      error: "Unauthorized",
      message: "A valid Bearer token is required",
    });
  }
}

/**
 * Pre-handler for admin-only routes. Must run after authGuard.
 */
export async function adminGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.user?.role !== "admin") {
    return reply.status(403).send({ error: "Forbidden", message: "Admin access required" });
  }
}
