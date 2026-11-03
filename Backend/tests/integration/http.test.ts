import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { Job } from "bullmq";
import { createQueue } from "../../src/queue/queue";
import { createAuthRoutes } from "../../src/routes/auth.routes";
import { AuthService } from "../../src/services/auth.service";
import { SubmissionService } from "../../src/services/submission.service";
import { MockProblemRepository } from "../../src/repositories/MockProblemRepository";
import { SubmissionController } from "../../src/controllers/submit.controller";
import { createSubmissionRoutes } from "../../src/routes/submit.routes";
import { authenticateToken } from "../../src/middleware/auth.middleware";
import { globalErrorHandler } from "../../src/middleware/errorHandler";
import { SubmissionModel } from "../../src/models/Submission.model";
import { ProblemModel } from "../../src/models/Problem.model";
import { JudgeService } from "../../src/services/judge.service";
import { processSubmission } from "../../src/queue/processor";
import { migrate } from "../../src/scripts/migrate";
import { seedProblems } from "../../src/data/seedProblems";
import { Verdict } from "../../src/types";
const queue = createQueue(),
  secret = "isolated-test-only-secret-32-characters";
const app = express();
app.use(express.json());
app.use("/api/auth", createAuthRoutes(new AuthService(secret, "")));
app.use(
  "/api/submissions",
  createSubmissionRoutes(
    new SubmissionController(
      new SubmissionService(queue, new MockProblemRepository()),
    ),
    authenticateToken(secret),
  ),
);
app.use(globalErrorHandler);
let token = "",
  submissionId = "";
beforeAll(async () => {
  if (
    !process.env.TEST_MONGODB_URI?.includes("nexorithm_test") ||
    !process.env.REDIS_URL?.endsWith("/15")
  )
    throw new Error("Dedicated test database/Redis required");
  await mongoose.connect(process.env.TEST_MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await queue.obliterate({ force: true });
});
afterAll(async () => {
  vi.restoreAllMocks();
  if (mongoose.connection.readyState === 1)
    await mongoose.connection.dropDatabase();
  await queue.close();
  await mongoose.disconnect();
});
describe("HTTP submission lifecycle with real Mongo/Redis and stubbed execution boundary", () => {
  it("registers and logs in with bcrypt-backed authentication", async () => {
    const registered = await request(app).post("/api/auth/register").send({
      username: "tester",
      email: "test@example.com",
      password: "password123",
    });
    expect(registered.status).toBe(201);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });
    expect(login.status).toBe(200);
    token = login.body.token;
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: "test@example.com", password: "incorrect" })
      ).status,
    ).toBe(401);
  });
  it("rejects unauthenticated and invalid submissions", async () => {
    expect((await request(app).post("/api/submissions").send({})).status).toBe(
      401,
    );
    expect(
      (
        await request(app)
          .post("/api/submissions")
          .auth(token, { type: "bearer" })
          .send({ code: "", language: "sh", problemId: {} })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .get("/api/submissions/not-an-id")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(400);
  });
  it("returns 202 without calling judge code", async () => {
    const spy = vi.spyOn(JudgeService.prototype, "judge");
    const response = await request(app)
      .post("/api/submissions")
      .auth(token, { type: "bearer" })
      .send({
        code: "function twoSum(){return [0,1]}",
        language: "javascript",
        problemId: "1",
      });
    expect(response.status).toBe(202);
    expect(response.body.status).toBe("queued");
    submissionId = response.body.submissionId;
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(
      (
        await request(app)
          .get(`/api/submissions/${submissionId}`)
          .auth(token, { type: "bearer" })
      ).body.status,
    ).toBe("queued");
  });
  it("processes a queued record and atomically persists the result", async () => {
    await ProblemModel.create(seedProblems[0]);
    const spy = vi.spyOn(JudgeService.prototype, "judge").mockResolvedValue({
      verdict: Verdict.ACCEPTED,
      passedCount: 3,
      totalCount: 3,
      results: [],
      totalExecutionTimeMs: 12,
    });
    await processSubmission({
      data: { submissionId },
      id: submissionId,
    } as Job);
    expect(spy).toHaveBeenCalledTimes(1);
    const result = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .auth(token, { type: "bearer" });
    expect(result.body.status).toBe("completed");
    expect(result.body.verdict).toBe("Accepted");
    expect(result.body.leaseToken).toBeUndefined();
    await processSubmission({
      data: { submissionId },
      id: submissionId,
    } as Job);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
  it("does not reveal submissions to a second authenticated user", async () => {
    const other = await request(app).post("/api/auth/register").send({
      username: "other",
      email: "other@example.com",
      password: "password123",
    });
    expect(
      (
        await request(app)
          .get(`/api/submissions/${submissionId}`)
          .auth(other.body.token, { type: "bearer" })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get("/api/submissions")
          .auth(other.body.token, { type: "bearer" })
      ).body.total,
    ).toBe(0);
  });
  it("rejects invalid worker payloads as unrecoverable", async () => {
    await expect(
      processSubmission({
        data: { submissionId: "malformed", code: "not-allowed" },
      } as Job),
    ).rejects.toThrow("Invalid judge payload");
  });
  it("migrates legacy submissions idempotently without changing verdict/source", async () => {
    await SubmissionModel.collection.insertOne({
      userId: "legacy",
      problemId: "1",
      language: "python",
      code: "preserve",
      verdict: "Accepted",
      submittedAt: new Date(),
      passedTestCases: 1,
      totalTestCases: 1,
      executionTimeMs: 5,
    });
    expect((await migrate()).migratedSubmissions).toBe(1);
    expect((await migrate()).migratedSubmissions).toBe(0);
    const legacy = await SubmissionModel.findOne({ userId: "legacy" }).lean();
    expect(legacy?.code).toBe("preserve");
    expect(legacy?.verdict).toBe("Accepted");
    expect(legacy?.status).toBe("completed");
  });
});
