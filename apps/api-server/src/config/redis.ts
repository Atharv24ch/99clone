import { Redis } from "ioredis";

const redisUrl =
  process.env["REDIS_URL"] ?? "redis://:redispassword@localhost:6379";

// ─── Singleton Redis client ───────────────────────────────────────────────────

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err: Error) => console.error("❌ Redis error:", err.message));

/**
 * Separate Redis instance for BullMQ workers (must have maxRetriesPerRequest: null).
 * Workers should create their own connection using this factory.
 */
export function createWorkerRedis(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
