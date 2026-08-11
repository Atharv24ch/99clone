import { buildApp } from "./app.js";
import { verifyDbConnection } from "./config/db.js";
import { redis } from "./config/redis.js";
import { ensurePropertyIndex } from "./config/opensearch.js";

const PORT = parseInt(process.env["PORT"] ?? "3002", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";

async function start(): Promise<void> {
  // ── Preflight checks ────────────────────────────────────────────────────────
  console.log("🚀 Starting 99acres API Server...");

  if (redis.status === "wait") {
    await redis.connect();
  }

  await verifyDbConnection();

  // Ensure OpenSearch index exists
  await ensurePropertyIndex().catch((err) => {
    console.warn("⚠️  OpenSearch index setup failed (non-fatal):", (err as Error).message);
  });

  // ── Build and start server ──────────────────────────────────────────────────
  const app = await buildApp();

  await app.listen({ port: PORT, host: HOST });

  console.log(`\n✅ API Server ready on http://${HOST}:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`📦 API:    http://localhost:${PORT}/api/v1\n`);

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n⏹  Received ${signal} — shutting down gracefully...`);
    await app.close();
    await redis.quit();
    console.log("✅ Server closed");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err: unknown) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
