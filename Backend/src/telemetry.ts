import pino from "pino";
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "password",
    "token",
    "code",
    "sourceCode",
  ],
});
export const registry = new Registry();
collectDefaultMetrics({ register: registry });
const counter = (name: string, labels: string[] = []) =>
  new Counter({ name, help: name, labelNames: labels, registers: [registry] });
const histogram = (name: string, labels: string[] = []) =>
  new Histogram({
    name,
    help: name,
    labelNames: labels,
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [registry],
  });
export const metrics = {
  requests: counter("nx_http_requests_total", ["method", "route", "status"]),
  latency: histogram("nx_http_duration_seconds", ["method"]),
  submissions: counter("nx_submissions_total", ["language"]),
  verdicts: counter("nx_verdicts_total", ["verdict"]),
  queueWait: histogram("nx_queue_wait_seconds"),
  execution: histogram("nx_execution_seconds"),
  sandboxStartup: histogram("nx_sandbox_startup_seconds"),
  cleanupFailures: counter("nx_sandbox_cleanup_failures_total"),
  reaped: counter("nx_sandboxes_reaped_total"),
  workerFailures: counter("nx_worker_failures_total"),
  persisted: new Gauge({
    name: "nx_submissions_persisted",
    help: "Submissions stored in MongoDB. This is not a process-local counter.",
    registers: [registry],
  }),
  queueDepth: new Gauge({
    name: "nx_queue_depth",
    help: "Pending durable submissions",
    registers: [registry],
  }),
  active: new Gauge({
    name: "nx_worker_active",
    help: "Active worker jobs",
    registers: [registry],
  }),
};
