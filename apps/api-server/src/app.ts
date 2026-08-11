import Fastify, { type FastifyError } from "fastify";
import rateLimit from "@fastify/rate-limit";

import { corsPlugin } from "./plugins/cors.js";
import { authPlugin } from "./plugins/auth.js";
import { registerRoutes } from "./routes/index.js";
import { redis } from "./config/redis.js";

/**
 * Build and configure the Fastify application instance.
 * Returns the configured app without starting the server
 * (keeps it testable — tests can inject requests without binding a port).
 */
export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env["NODE_ENV"] === "production" ? "warn" : "info",
    },
    trustProxy: true,
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────
  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);

  // Rate limiting — 200 req/min per IP (auth routes have tighter limits)
  await fastify.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    redis,
    keyGenerator(request) {
      return request.ip;
    },
    errorResponseBuilder(_request, context) {
      return {
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)}s`,
      };
    },
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  await registerRoutes(fastify);

  // ── Global error handler ──────────────────────────────────────────────────────
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: error.name ?? "Internal Server Error",
      message:
        process.env["NODE_ENV"] === "production" && statusCode >= 500
          ? "Something went wrong"
          : error.message,
      statusCode,
    });
  });

  // ── 404 handler ───────────────────────────────────────────────────────────────
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: "Not Found",
      message: "The requested endpoint does not exist",
      statusCode: 404,
    });
  });

  return fastify;
}
