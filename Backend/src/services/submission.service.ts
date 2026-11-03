import { z } from "zod";
import { Queue } from "bullmq";
import mongoose from "mongoose";
import { IProblemRepository } from "../interfaces/IProblemRepository";
import { SubmissionModel } from "../models/Submission.model";
import { Language } from "../types";
import { AppError, NotFoundError } from "../errors/AppError";
import { enqueue } from "../queue/queue";
import { executionConfig } from "../config/execution";
import { problemContract } from "./contracts";
import { logger, metrics } from "../telemetry";
export const idSchema = z.string().regex(/^[a-f0-9]{24}$/);
export const problemIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const submissionSchema = z
  .object({
    code: z
      .string()
      .refine(
        (s) => s.trim().length > 0 && Buffer.byteLength(s) <= 65536,
        "Source must be 1–65536 bytes",
      ),
    language: z.nativeEnum(Language),
    problemId: problemIdSchema,
  })
  .strict();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export class SubmissionService {
  constructor(
    private readonly queue: Queue,
    private readonly problemRepo: IProblemRepository,
  ) {}
  async submitCode(raw: unknown, userId: string, requestId?: string) {
    const request = submissionSchema.parse(raw);
    if (mongoose.connection.readyState !== 1)
      throw new AppError("Submission storage unavailable", 503);
    const pending = await SubmissionModel.countDocuments({
      status: { $in: ["queued", "running"] },
    });
    if (pending >= executionConfig().MAX_PENDING_SUBMISSIONS)
      throw new AppError("Judge queue is full; try again later", 503);
    const problem = await this.problemRepo.findById(request.problemId);
    if (!problem) throw new NotFoundError("Problem");
    if (!problem.testCases.length || problem.testCases.length > 100)
      throw new AppError(
        "Problem has no supported authoritative test suite",
        422,
      );
    try {
      problemContract(problem);
    } catch {
      throw new AppError("Problem execution contract unavailable", 422);
    }
    const row = await SubmissionModel.create({
      ...request,
      userId,
      status: "queued",
      requestId,
      totalTestCases: problem.testCases.length,
    });
    metrics.submissions.inc({ language: request.language });
    try {
      await enqueue(this.queue, String(row._id), requestId);
    } catch {
      logger.warn({
        submissionId: String(row._id),
        requestId,
        operation: "enqueue",
        outcome: "pending_reconciliation",
      });
    }
    return { submissionId: String(row._id), status: "queued" };
  }
  async getSubmission(id: string, userId: string) {
    const row = await SubmissionModel.findOne({
      _id: idSchema.parse(id),
      userId,
    })
      .select("-leaseToken -leaseExpiresAt -__v -requestId")
      .lean();
    if (!row) throw new NotFoundError("Submission");
    return { ...row, id: String(row._id), status: row.status ?? "completed" };
  }
  async list(userId: string, query: unknown, problemId?: string) {
    const { page, limit } = paginationSchema.parse(query);
    const filter = {
      userId,
      ...(problemId ? { problemId: problemIdSchema.parse(problemId) } : {}),
    };
    const [rows, total] = await Promise.all([
      SubmissionModel.find(filter)
        .select("-result -leaseToken -leaseExpiresAt -__v -requestId")
        .sort({ submittedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SubmissionModel.countDocuments(filter),
    ]);
    return {
      submissions: rows.map((row) => ({
        ...row,
        id: String(row._id),
        status: row.status ?? "completed",
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
