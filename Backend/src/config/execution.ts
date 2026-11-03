import { z } from "zod";
export function executionConfig() {
  const number = (fallback: number, max: number) =>
    z.coerce.number().int().positive().max(max).default(fallback);
  return z
    .object({
      EXECUTION_TIMEOUT_MS: number(5000, 30000),
      EXECUTION_MEMORY_MB: number(256, 1024),
      EXECUTION_CPUS: z.coerce.number().positive().max(2).default(1),
      EXECUTION_MAX_OUTPUT: number(1048576, 4194304),
      EXECUTION_PIDS: number(32, 64),
      WORKER_CONCURRENCY: number(2, 16),
      MAX_PENDING_SUBMISSIONS: number(1000, 100000),
      SANDBOX_RUNTIME: z.enum(["runsc", "runc"]).default("runsc"),
      ALLOW_WEAK_SANDBOX: z.enum(["true", "false"]).default("false"),
      NODE_ENV: z.string().default("development"),
      PYTHON_IMAGE: z
        .string()
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9_./:@-]+$/)
        .default("python:3.12.10-slim-bookworm"),
      JAVASCRIPT_IMAGE: z
        .string()
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9_./:@-]+$/)
        .default("node:22.15.0-bookworm-slim"),
    })
    .parse(process.env);
}
export function assertSandboxPolicy() {
  const c = executionConfig();
  if (
    c.SANDBOX_RUNTIME !== "runsc" &&
    (c.NODE_ENV === "production" || c.ALLOW_WEAK_SANDBOX !== "true")
  )
    throw new Error(
      "Sandbox requires runsc; weak local mode must be explicitly enabled outside production",
    );
  return c;
}
