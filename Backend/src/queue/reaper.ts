import mongoose from "mongoose";
import express from "express";
import { connectDatabase } from "../config/database";
import { SubmissionModel } from "../models/Submission.model";
import { docker } from "../services/executorFactory";
import {
  decideSandbox,
  LeaseView,
  REAP_INTERVAL_MS,
  SandboxSnapshot,
} from "../services/sandboxLifecycle";
import { logger, metrics, registry } from "../telemetry";

function finishedAtMs(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed < Date.UTC(2000, 0, 1)) return null;
  return parsed;
}

async function leaseView(submissionId: string): Promise<LeaseView | null> {
  if (!/^[a-f0-9]{24}$/.test(submissionId)) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const row = (await Promise.race([
      SubmissionModel.findById(submissionId)
        .select("status leaseToken leaseExpiresAt")
        .lean(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 500);
      }),
    ])) as {
      status?: string;
      leaseToken?: string | null;
      leaseExpiresAt?: Date | null;
    } | null;
    if (!row?.status) return null;
    return {
      status: row.status,
      leaseToken: row.leaseToken,
      leaseExpiresAtMs: row.leaseExpiresAt
        ? new Date(row.leaseExpiresAt).getTime()
        : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function reapSandboxes(now = Date.now()) {
  const listed = await docker([
    "ps",
    "-aq",
    "--filter",
    "label=nexorithm.sandbox=true",
  ]);
  if (listed.code !== 0) throw new Error("Sandbox runtime unavailable");
  for (const id of listed.stdout.trim().split("\n").filter(Boolean)) {
    const inspected = await docker([
      "inspect",
      "--format",
      "{{.State.Running}}\t{{.State.FinishedAt}}\t{{json .Config.Labels}}",
      id,
    ]);
    if (inspected.code !== 0) continue;
    const [runningRaw, finishedRaw, labelsRaw] = inspected.stdout
      .trim()
      .split("\t");
    let labels: Record<string, string> = {};
    try {
      labels = JSON.parse(labelsRaw || "{}") as Record<string, string>;
    } catch {
      continue;
    }
    if (labels["nexorithm.sandbox"] !== "true") continue;
    const snapshot: SandboxSnapshot = {
      running: runningRaw === "true",
      finishedAtMs: finishedAtMs(finishedRaw || ""),
      expiresAtMs: Number(labels["nexorithm.expires"]),
      leaseToken: labels["nexorithm.lease"],
    };
    const lease = snapshot.running
      ? await leaseView(labels["nexorithm.submission"] || "")
      : null;
    if (decideSandbox(now, snapshot, lease) !== "remove") continue;
    const removed = await docker(["rm", "-f", id]);
    if (removed.code !== 0) {
      metrics.cleanupFailures.inc();
      logger.error({ operation: "sandbox_reap", outcome: "failed" });
      continue;
    }
    metrics.reaped.inc();
    logger.info({
      operation: "sandbox_reap",
      outcome: "removed",
      running: snapshot.running,
    });
  }
}

async function main() {
  if (process.env.MONGODB_URI) {
    await connectDatabase(process.env.MONGODB_URI).catch(() =>
      logger.error({ operation: "reaper_database", outcome: "unavailable" }),
    );
  }
  const tick = async () => {
    try {
      await reapSandboxes();
    } catch {
      logger.error({ operation: "sandbox_reap", outcome: "unavailable" });
    }
  };
  const timer = setInterval(() => {
    void tick();
  }, REAP_INTERVAL_MS);
  await tick();
  const app = express();
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      if (
        (
          await docker([
            "ps",
            "-aq",
            "--filter",
            "label=nexorithm.sandbox=true",
          ])
        ).code !== 0
      )
        throw new Error("runtime");
      res.json({ status: "ready" });
    } catch {
      res
        .status(503)
        .json({ status: "unavailable", dependencies: ["runtime"] });
    }
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
  const server = app.listen(9092, "0.0.0.0");
  const shutdown = async () => {
    clearInterval(timer);
    server.close();
    await mongoose.disconnect().catch(() => undefined);
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
      operation: "reaper_boot",
      outcome: "failed",
      errorCategory: error instanceof Error ? error.message : "unknown",
    });
    process.exit(1);
  });
