import type { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";

export async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyCors, {
    origin:
      process.env["NODE_ENV"] === "production"
        ? ["https://yourdomain.com", "https://www.yourdomain.com"]
        : true, // allow all origins in dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  });
}
