import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { loadConfig } from "./config";
import { connectDatabase } from "./config/database";
import { globalErrorHandler } from "./middleware/errorHandler";
import { authenticateToken } from "./middleware/auth.middleware";

import { MockProblemRepository } from "./repositories/MockProblemRepository";
import { MockSubmissionRepository } from "./repositories/MockSubmissionRepository";
import { MongoProblemRepository } from "./repositories/MongoProblemRepository";
import { MongoSubmissionRepository } from "./repositories/MongoSubmissionRepository";

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { createQueue } from "./queue/queue";
import { reconcile } from "./queue/reconcile";
import { logger, metrics, registry } from "./telemetry";
import { assessReadiness } from "./health";
import { ProblemService } from "./services/problem.service";
import { SubmissionService } from "./services/submission.service";
import { AuthService } from "./services/auth.service";
import { DashboardService } from "./services/dashboard.service";

import { LeetCodeApiClient } from "./api/external/LeetCodeApiClient";

import { ProblemController } from "./controllers/problem.controller";
import { SubmissionController } from "./controllers/submit.controller";
import { DashboardController } from "./controllers/dashboard.controller";

import { createProblemRoutes } from "./routes/problem.routes";
import { createSubmissionRoutes } from "./routes/submit.routes";
import { createAuthRoutes } from "./routes/auth.routes";
import { createDashboardRoutes } from "./routes/dashboard.routes";

export async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      ...(config.nodeEnv === "development" ? { hsts: false } : {}),
    }),
  );
  app.use(
    cors({
      origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    }),
  );
  app.use(express.json({ limit: "80kb" }));
  app.use((req, res, next) => {
    const started = performance.now();
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    res.on("finish", () => {
      metrics.requests.inc({
        method: req.method,
        route: req.route?.path ?? "other",
        status: String(res.statusCode),
      });
      metrics.latency.observe(
        { method: req.method },
        (performance.now() - started) / 1000,
      );
      logger.info({
        requestId,
        operation: "http",
        method: req.method,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });
    next();
  });
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 60000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests" },
    }),
  );

  if (config.useDb && config.mongodbUri) {
    await connectDatabase(config.mongodbUri);
  }

  const problemRepo =
    config.useDb && config.mongodbUri
      ? new MongoProblemRepository()
      : new MockProblemRepository();

  const submissionRepo =
    config.useDb && config.mongodbUri
      ? new MongoSubmissionRepository()
      : new MockSubmissionRepository();

  const externalApi = new LeetCodeApiClient();
  const queue = createQueue();
  const problemService = new ProblemService(problemRepo, externalApi);
  const submissionService = new SubmissionService(queue, problemRepo);
  const authService = new AuthService(config.jwtSecret, config.googleClientId);
  const dashboardService = new DashboardService(submissionRepo, problemRepo);

  const problemController = new ProblemController(problemService);
  const submissionController = new SubmissionController(submissionService);
  const dashboardController = new DashboardController(dashboardService);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      dbConnected: mongoose.connection.readyState === 1,
    });
  });

  app.use(
    "/api/problems/seed",
    authenticateToken(config.jwtSecret),
    (req, res, next) => {
      if (req.user?.role !== "admin") {
        res.sendStatus(403);
        return;
      }
      next();
    },
  );
  app.use("/api/problems", createProblemRoutes(problemController));
  app.use(
    "/api/submissions",
    createSubmissionRoutes(
      submissionController,
      authenticateToken(config.jwtSecret, true),
    ),
  );
  app.use(
    "/api/dashboard",
    createDashboardRoutes(
      dashboardController,
      authenticateToken(config.jwtSecret, true),
    ),
  );
  app.use("/api/auth", createAuthRoutes(authService));

  let closing = false;
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    const report = await assessReadiness({
      closing,
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
  let reconciling = false;
  const timer = setInterval(() => {
    if (reconciling || mongoose.connection.readyState !== 1) return;
    reconciling = true;
    void reconcile(queue)
      .catch(() => logger.warn({ operation: "outbox_reconciliation" }))
      .finally(() => {
        reconciling = false;
      });
  }, 10000);
  app.use(globalErrorHandler);

  const server = app.listen(config.port, () => {
    logger.info({
      operation: "api_boot",
      port: config.port,
      mode: config.nodeEnv,
    });
  });
  const shutdown = async () => {
    closing = true;
    clearInterval(timer);
    server.close(async () => {
      await queue.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.once("SIGTERM", () => {
    void shutdown();
  });
  process.once("SIGINT", () => {
    void shutdown();
  });
}

if (require.main === module)
  bootstrap().catch((error: unknown) => {
    logger.fatal({
      operation: "api_boot",
      outcome: "failed",
      errorCategory: error instanceof Error ? error.message : "unknown",
    });
    process.exit(1);
  });
