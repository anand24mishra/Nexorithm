import "dotenv/config";
import { Worker } from "bullmq";
import mongoose from "mongoose";
import express from "express";
import { connectDatabase } from "../config/database";
import { assertSandboxPolicy } from "../config/execution";
import { docker } from "../services/executorFactory";
import { assessReadiness } from "../health";
import { createQueue, redisConnection, QUEUE_NAME } from "./queue";
import { reconcile } from "./reconcile";
import { processSubmission } from "./processor";
import { reapSandboxes } from "./reaper";
import { logger, registry } from "../telemetry";
async function main() {
  const config = assertSandboxPolicy();
  if (!process.env.MONGODB_URI) throw new Error("Worker requires MONGODB_URI");
  await connectDatabase(process.env.MONGODB_URI);
  const runtime = await docker(["info", "--format", "{{json .Runtimes}}"]);
  if (
    runtime.code !== 0 ||
    !(config.SANDBOX_RUNTIME in JSON.parse(runtime.stdout))
  )
    throw new Error("Required runtime unavailable");
  for (const image of [config.PYTHON_IMAGE, config.JAVASCRIPT_IMAGE]) {
    if ((await docker(["image", "inspect", image])).code !== 0)
      throw new Error("Pre-pull pinned runtime images");
  }
  await reapSandboxes();
  const queue = createQueue();
  const worker = new Worker(QUEUE_NAME, processSubmission, {
    connection: redisConnection(),
    concurrency: config.WORKER_CONCURRENCY,
    lockDuration: 90000,
    maxStalledCount: 2,
  });
  let healthy = true,
    closing = false,
    busy = false;
  worker.on("error", () => {
    healthy = false;
    logger.error({ operation: "worker_connection" });
  });
  worker.on("ready", () => {
    healthy = true;
  });
  worker.on("failed", (job) =>
    logger.warn({ operation: "job_failed", jobId: job?.id }),
  );
  const tick = async () => {
    if (busy || closing) return;
    busy = true;
    try {
      await reapSandboxes();
      await reconcile(queue);
      healthy = true;
    } catch {
      healthy = false;
      logger.error({ operation: "worker_reconciliation" });
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => {
    void tick();
  }, 10000);
  await tick();
  const app = express();
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    const report = await assessReadiness({
      closing: closing || !healthy,
      mongo: async () => {
        if (mongoose.connection.readyState !== 1 || !mongoose.connection.db)
          throw new Error("mongo");
        await mongoose.connection.db.command({ ping: 1 });
      },
      redis: () => queue.getJobCounts(),
    });
    if (report.status !== "ready") {
      res.status(503).json(report);
      return;
    }
    res.json(report);
  });
  app.get("/metrics", async (req, res) => {
    if (
      !process.env.METRICS_TOKEN ||
      req.headers.authorization !== `Bearer ${process.env.METRICS_TOKEN}`
    ) {
      res.sendStatus(401);
      return;
    }
    res.type(registry.contentType).send(await registry.metrics());
  });
  const server = app.listen(9091, "0.0.0.0");
  const shutdown = async () => {
    closing = true;
    clearInterval(timer);
    server.close();
    await worker.close();
    await reapSandboxes().catch(() => undefined);
    await queue.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.once("SIGTERM", () => {
    void shutdown();
  });
  process.once("SIGINT", () => {
    void shutdown();
  });
}
if (require.main === module)
  void main().catch((error: unknown) => {
    logger.fatal({
      operation: "worker_boot",
      outcome: "failed",
      errorCategory: error instanceof Error ? error.message : "unknown",
    });
    process.exit(1);
  });
