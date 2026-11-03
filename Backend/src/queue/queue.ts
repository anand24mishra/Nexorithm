import { Queue } from "bullmq";
import { z } from "zod";
import { logger } from "../telemetry";
export const jobSchema = z
  .object({
    submissionId: z.string().regex(/^[a-f0-9]{24}$/),
    requestId: z.string().max(100).optional(),
  })
  .strict();
export function redisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  if (!["redis:", "rediss:"].includes(url.protocol))
    throw new Error("Invalid Redis URL");
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number(url.pathname.slice(1) || 0),
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
    connectTimeout: 3000,
    enableOfflineQueue: false,
  };
}
export const QUEUE_NAME = "nexorithm-judge";
export function createQueue() {
  const queue = new Queue(QUEUE_NAME, {
    connection: {
      ...redisConnection(),
      maxRetriesPerRequest: 1,
      commandTimeout: 2000,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { age: 86400, count: 10000 },
      removeOnFail: { age: 604800, count: 10000 },
    },
  });
  queue.on("error", () =>
    logger.error({
      operation: "queue_connection",
      errorCategory: "infrastructure",
    }),
  );
  return queue;
}
export async function enqueue(
  queue: Queue,
  submissionId: string,
  requestId?: string,
) {
  await queue.add("judge", jobSchema.parse({ submissionId, requestId }), {
    jobId: submissionId,
  });
}
