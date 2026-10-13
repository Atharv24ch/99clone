import type { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";

export async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  // In production, read allowed origins from the ALLOWED_ORIGIN env var.
  // Set ALLOWED_ORIGIN to your deployed Vercel frontend URL (comma-separated for multiple).
  const productionOrigins = process.env["ALLOWED_ORIGIN"]
    ? process.env["ALLOWED_ORIGIN"].split(",").map((o) => o.trim())
    : [];

  await fastify.register(fastifyCors, {
    origin:
      process.env["NODE_ENV"] === "production"
        ? productionOrigins
        : true, // allow all origins in dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  });
}
