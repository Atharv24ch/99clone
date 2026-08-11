import { db } from "@99acres/db";

// Re-export the singleton db client from the shared package
export { db };

/**
 * Verify DB connection is live on startup.
 * Throws if the DB is unreachable so the server fails fast.
 */
export async function verifyDbConnection(): Promise<void> {
  try {
    await db.execute("SELECT 1" as unknown as Parameters<typeof db.execute>[0]);
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err);
    throw err;
  }
}
