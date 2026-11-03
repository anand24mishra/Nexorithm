import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Worker } from "bullmq";
import {
  createQueue,
  redisConnection,
  QUEUE_NAME,
} from "../../src/queue/queue";
import { SubmissionModel } from "../../src/models/Submission.model";
import { AsyncSubmissionRepository } from "../../src/repositories/AsyncSubmissionRepository";
import { SubmissionService } from "../../src/services/submission.service";
import { MockProblemRepository } from "../../src/repositories/MockProblemRepository";
import { reconcile } from "../../src/queue/reconcile";
import { Language, Verdict } from "../../src/types";
const queue = createQueue();
const owner = "a".repeat(24),
  other = "b".repeat(24);
const service = new SubmissionService(queue, new MockProblemRepository());
const repo = new AsyncSubmissionRepository();
beforeAll(async () => {
  if (
    !process.env.TEST_MONGODB_URI?.includes("nexorithm_test") ||
    !process.env.REDIS_URL?.endsWith("/15")
  )
    throw new Error(
      "Use isolated TEST_MONGODB_URI containing nexorithm_test and REDIS_URL db 15",
    );
  await mongoose.connect(process.env.TEST_MONGODB_URI);
  await queue.obliterate({ force: true });
});
beforeEach(async () => {
  await SubmissionModel.deleteMany({});
  await queue.drain(true);
});
afterAll(async () => {
  if (mongoose.connection.readyState === 1)
    await mongoose.connection.dropDatabase();
  await queue.close();
  await mongoose.disconnect();
});
async function create() {
  return service.submitCode(
    {
      code: "function twoSum() {return [0,1]}",
      language: Language.JAVASCRIPT,
      problemId: "1",
    },
    owner,
  );
}
describe("durable queue integration", () => {
  it("creates one pending record and identifier-only queue job", async () => {
    const created = await create();
    expect(created.status).toBe("queued");
    const job = await queue.getJob(created.submissionId);
    expect(job?.data).toEqual({ submissionId: created.submissionId });
    expect(await SubmissionModel.countDocuments()).toBe(1);
  });
  it("enforces ownership and paginates", async () => {
    const created = await create();
    await expect(
      service.getSubmission(created.submissionId, other),
    ).rejects.toThrow();
    expect((await service.list(owner, { limit: 1 })).submissions).toHaveLength(
      1,
    );
    expect((await service.list(other, {})).total).toBe(0);
  });
  it("claims once and rejects stale or duplicate completion", async () => {
    const created = await create(),
      claimed = await repo.claim(created.submissionId);
    expect(claimed).not.toBeNull();
    expect(await repo.claim(created.submissionId)).toBeNull();
    const result = {
      verdict: Verdict.ACCEPTED,
      passedCount: 3,
      totalCount: 3,
      executionTimeMs: 1,
      stdout: "",
      stderr: "",
      results: [],
    };
    expect(
      (await repo.complete(created.submissionId, "stale", result, 1))
        .modifiedCount,
    ).toBe(0);
    expect(
      (
        await repo.complete(
          created.submissionId,
          claimed!.leaseToken!,
          result,
          1,
        )
      ).modifiedCount,
    ).toBe(1);
    expect(
      (
        await repo.complete(
          created.submissionId,
          claimed!.leaseToken!,
          result,
          1,
        )
      ).modifiedCount,
    ).toBe(0);
    expect(await repo.claim(created.submissionId)).toBeNull();
  });
  it("reconstructs a missing Redis job from the Mongo outbox", async () => {
    const created = await create();
    await (await queue.getJob(created.submissionId))!.remove();
    await reconcile(queue);
    expect(await queue.getJob(created.submissionId)).toBeDefined();
  });
  it("recovers expired leases with fencing", async () => {
    const created = await create();
    const previous = await repo.claim(created.submissionId);
    await SubmissionModel.updateOne(
      { _id: created.submissionId },
      { $set: { leaseExpiresAt: new Date(0) } },
    );
    await repo.recoverExpired();
    const next = await repo.claim(created.submissionId);
    expect(next!.leaseToken).not.toBe(previous!.leaseToken);
    expect(next!.workerAttempt).toBe(2);
  });
  it("terminates after bounded infrastructure attempts", async () => {
    const created = await create();
    for (let i = 0; i < 3; i++) {
      const row = await repo.claim(created.submissionId);
      await repo.infrastructureFailure(
        created.submissionId,
        row!.leaseToken!,
        i === 2,
      );
    }
    expect(
      (await service.getSubmission(created.submissionId, owner)).status,
    ).toBe("failed");
  });
  it("BullMQ consumes a persisted queue job", async () => {
    const created = await create();
    const consumed = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Queue delivery timeout")),
        10000,
      );
      const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          clearTimeout(timer);
          resolve(job.data.submissionId);
        },
        { connection: redisConnection() },
      );
      worker.on("completed", () => {
        void worker.close();
      });
    });
    expect(await consumed).toBe(created.submissionId);
  });
});
