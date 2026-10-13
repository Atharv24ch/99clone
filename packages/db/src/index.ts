import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

// ─── Singleton DB client ──────────────────────────────────────────────────────

const connectionString =
  process.env["DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5432/acres99";

// `postgres` driver — use max:1 for migrations, higher pool for server
const queryClient = postgres(connectionString, {
  max: parseInt(process.env["DB_POOL_MAX"] ?? "10", 10),
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema, logger: process.env["NODE_ENV"] === "development" });

// Re-export everything
export * from "./schema/index.js";
export { schema };
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
