import { randomUUID } from "node:crypto";
import { SubmissionModel } from "../models/Submission.model";
import { SubmissionResponse, Verdict } from "../types";
export const MAX_ATTEMPTS = 3;
export const DEFAULT_LEASE_MS = 90000;
export function leaseDurationMs() {
  const raw = Number(process.env.LEASE_MS ?? DEFAULT_LEASE_MS);
  if (!Number.isInteger(raw) || raw < 1000 || raw > 600000)
    return DEFAULT_LEASE_MS;
  return raw;
}
export class AsyncSubmissionRepository {
  async claim(id: string) {
    return SubmissionModel.findOneAndUpdate(
      { _id: id, status: "queued", workerAttempt: { $lt: MAX_ATTEMPTS } },
      {
        $set: {
          status: "running",
          startedAt: new Date(),
          leaseToken: randomUUID(),
          leaseExpiresAt: new Date(Date.now() + leaseDurationMs()),
        },
        $inc: { workerAttempt: 1 },
      },
      { returnDocument: "after" },
    ).lean();
  }
  async heartbeat(id: string, token: string) {
    return SubmissionModel.updateOne(
      { _id: id, status: "running", leaseToken: token },
      { $set: { leaseExpiresAt: new Date(Date.now() + leaseDurationMs()) } },
    );
  }
  async complete(
    id: string,
    token: string,
    result: SubmissionResponse,
    queueWaitMs: number,
  ) {
    return SubmissionModel.updateOne(
      { _id: id, status: "running", leaseToken: token },
      {
        $set: {
          status: "completed",
          verdict: result.verdict,
          completedAt: new Date(),
          result,
          passedTestCases: result.passedCount,
          totalTestCases: result.totalCount,
          executionTimeMs: result.executionTimeMs,
          queueWaitMs,
        },
        $unset: { leaseToken: "", leaseExpiresAt: "", errorCategory: "" },
      },
    );
  }
  async infrastructureFailure(id: string, token: string, final: boolean) {
    return SubmissionModel.updateOne(
      { _id: id, status: "running", leaseToken: token },
      {
        $set: {
          status: final ? "failed" : "queued",
          verdict: final ? Verdict.SYSTEM_ERROR : null,
          errorCategory: "infrastructure",
          ...(final ? { completedAt: new Date() } : {}),
        },
        $unset: { leaseToken: "", leaseExpiresAt: "" },
      },
    );
  }
  async recoverExpired() {
    const expired = {
      status: "running" as const,
      leaseExpiresAt: { $lt: new Date() },
    };
    await SubmissionModel.updateMany(
      { ...expired, workerAttempt: { $gte: MAX_ATTEMPTS } },
      {
        $set: {
          status: "failed",
          verdict: Verdict.SYSTEM_ERROR,
          completedAt: new Date(),
          errorCategory: "lease_expired",
        },
        $unset: { leaseToken: "", leaseExpiresAt: "" },
      },
    );
    await SubmissionModel.updateMany(
      { ...expired, workerAttempt: { $lt: MAX_ATTEMPTS } },
      {
        $set: { status: "queued", errorCategory: "lease_expired" },
        $unset: { leaseToken: "", leaseExpiresAt: "" },
      },
    );
  }
}
