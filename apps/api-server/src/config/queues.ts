import { Queue } from "bullmq";

import { redis } from "./redis.js";

// ─── Producer-side queues (consumers live in src/queues, run by src/worker.ts) ─

export const notificationQueue = new Queue("notifications", { connection: redis });
export const imageQueue = new Queue("image-processing", { connection: redis });

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: 200,
  removeOnFail: 100,
};
