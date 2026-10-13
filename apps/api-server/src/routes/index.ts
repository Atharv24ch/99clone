import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "@99acres/db";

import { propertiesRoutes } from "./properties.js";
import { leadsRoutes } from "./leads.js";
import { authRoutes } from "./auth.js";
import { searchRoutes } from "./search.js";
import { uploadRoutes } from "./upload.js";
import { localitiesRoutes } from "./localities.js";
import { redis } from "../config/redis.js";

/**
 * Register all API routes under /api/v1 prefix.
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(
    async (v1) => {
      await v1.register(authRoutes, { prefix: "/auth" });
      await v1.register(propertiesRoutes, { prefix: "/properties" });
      await v1.register(leadsRoutes, { prefix: "/leads" });
      await v1.register(searchRoutes, { prefix: "/search" });
      await v1.register(uploadRoutes, { prefix: "/upload" });
      await v1.register(localitiesRoutes, { prefix: "/localities" });
    },
    { prefix: "/api/v1" }
  );

  // Health check — used by load balancers, Railway, and uptime monitors
  fastify.get("/health", async (_request, reply) => {
    const checks: Record<string, string> = { api: "ok" };

    // Check DB
    try {
      await db.execute(sql`SELECT 1`);
      checks["db"] = "ok";
    } catch {
      checks["db"] = "error";
    }

    // Check Redis
    try {
      await redis.ping();
      checks["redis"] = "ok";
    } catch {
      checks["redis"] = "error";
    }

    const allHealthy = Object.values(checks).every((v) => v === "ok");
    return reply.status(allHealthy ? 200 : 503).send({
      status: allHealthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    });
  });
}
