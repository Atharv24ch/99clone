import type { FastifyInstance } from "fastify";

import { propertiesRoutes } from "./properties.js";
import { leadsRoutes } from "./leads.js";
import { authRoutes } from "./auth.js";
import { searchRoutes } from "./search.js";
import { uploadRoutes } from "./upload.js";
import { localitiesRoutes } from "./localities.js";

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

  // Health check
  fastify.get("/health", async (_request, reply) => {
    return reply.send({ status: "ok", timestamp: new Date().toISOString() });
  });
}
