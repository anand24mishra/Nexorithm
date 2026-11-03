import { Job, UnrecoverableError } from "bullmq";
import {
  AsyncSubmissionRepository,
  MAX_ATTEMPTS,
} from "../repositories/AsyncSubmissionRepository";
import { MongoProblemRepository } from "../repositories/MongoProblemRepository";
import { JudgeService } from "../services/judge.service";
import { problemContract } from "../services/contracts";
import { jobSchema } from "./queue";
import { Language } from "../types";
import { logger, metrics } from "../telemetry";
import { crashAfterExecutionEnabled } from "./faults";
export async function processSubmission(job: Job) {
  const parsed = jobSchema.safeParse(job.data);
  if (!parsed.success) throw new UnrecoverableError("Invalid judge payload");
  const payload = parsed.data;
  const repo = new AsyncSubmissionRepository();
  const row = await repo.claim(payload.submissionId);
  if (!row) return; // Duplicate deliveries cannot claim a running/terminal record.
  const token = row.leaseToken!;
  const context = {
    requestId: row.requestId,
    submissionId: payload.submissionId,
    jobId: job.id,
    workerId: process.env.HOSTNAME ?? String(process.pid),
  };
  const heartbeat = setInterval(() => {
    void repo
      .heartbeat(payload.submissionId, token)
      .catch(() => logger.error({ ...context, operation: "lease_heartbeat" }));
  }, 15000);
  metrics.active.inc();
  logger.info({
    ...context,
    operation: "judge",
    outcome: "running",
    workerAttempt: row.workerAttempt,
  });
  try {
    const problem = await new MongoProblemRepository().findById(row.problemId);
    if (!problem || !problem.testCases.length || problem.testCases.length > 100)
      throw new Error("Problem unavailable");
    // Bounded suite budget, independent of per-case execution timeout.
    const started = Date.now();
    const judge = await new JudgeService().judge(
      row.code,
      row.language as Language,
      problem.testCases,
      problemContract(problem),
      {
        submissionId: payload.submissionId,
        attempt: row.workerAttempt,
        leaseToken: token,
        workerId: context.workerId,
      },
    );
    if (crashAfterExecutionEnabled()) {
      logger.error({
        ...context,
        operation: "fault_after_execution",
        outcome: "crash",
        errorCategory: "test_fault",
      });
      // PID 1 in this container namespace does not die when it signals
      // itself with SIGKILL. Exiting here is still before the terminal write.
      process.exit(137);
    }
    const result = {
      verdict: judge.verdict,
      passedCount: judge.passedCount,
      totalCount: judge.totalCount,
      stdout: "",
      stderr: "",
      executionTimeMs: judge.totalExecutionTimeMs,
      results: judge.results,
    };
    // Bound the aggregate persisted result, not just each sandbox output.
    let remaining = 1048576;
    result.results = result.results.map((tc) => {
      const safe = {
        ...tc,
        input: tc.input.slice(0, 8192),
        expectedOutput: tc.expectedOutput.slice(0, 8192),
        actualOutput: tc.actualOutput.slice(0, Math.min(8192, remaining)),
        stderr: tc.stderr.slice(0, 4096),
      };
      remaining = Math.max(
        0,
        remaining - Buffer.byteLength(JSON.stringify(safe)),
      );
      return safe;
    });
    const waitMs = Math.max(
      0,
      row.startedAt!.getTime() - row.queuedAt!.getTime(),
    );
    const saved = await repo.complete(
      payload.submissionId,
      token,
      result,
      waitMs,
    );
    if (saved.modifiedCount) {
      metrics.verdicts.inc({ verdict: judge.verdict });
      metrics.queueWait.observe(waitMs / 1000);
      metrics.execution.observe(judge.totalExecutionTimeMs / 1000);
    }
    logger.info({
      ...context,
      operation: "judge",
      outcome: judge.verdict,
      durationMs: Date.now() - started,
    });
  } catch {
    metrics.workerFailures.inc();
    const final = row.workerAttempt >= MAX_ATTEMPTS;
    await repo.infrastructureFailure(payload.submissionId, token, final);
    logger.error({
      ...context,
      operation: "judge",
      outcome: final ? "failed" : "retry",
      errorCategory: "infrastructure",
    });
    throw new Error("Judge infrastructure failure");
  } finally {
    clearInterval(heartbeat);
    metrics.active.dec();
  }
}
