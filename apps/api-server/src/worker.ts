/**
 * Background worker process entrypoint.
 * Runs BullMQ consumers separately from the HTTP server:
 *   node dist/worker.js   (or `pnpm --filter @99acres/api-server worker`)
 */
import "./queues/imageWorker.js";
import "./queues/notificationWorker.js";
