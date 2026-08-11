import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Route pre-handler that verifies JWT and populates request.user.
 * Usage: add `preHandler: [fastify.authenticate]` to protected routes.
 */
export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      error: "Unauthorized",
      message: "A valid Bearer token is required",
    });
  }
}
