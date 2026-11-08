import { z } from "zod";
import { Queue } from "bullmq";
import mongoose from "mongoose";
import { IProblemRepository } from "../interfaces/IProblemRepository";
import { SubmissionModel } from "../models/Submission.model";
import { ProblemModel } from "../models/Problem.model";
import { Language, Verdict } from "../types";
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
  async activity(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 400);
    const rows = await SubmissionModel.find({
      userId,
      submittedAt: { $gte: since },
    })
      .select("submittedAt")
      .lean();
    return {
      timestamps: rows
        .map((row) => row.submittedAt)
        .filter((value): value is Date => value instanceof Date)
        .map((value) => value.toISOString()),
    };
  }
  async analytics(userId: string, rawProblemId?: string) {
    const problemId = rawProblemId
      ? problemIdSchema.parse(rawProblemId)
      : undefined;
    const match: Record<string, unknown> = {
      userId,
      ...(problemId ? { problemId } : {}),
    };
    const since = new Date();
    since.setDate(since.getDate() - 400);
    const submissions = SubmissionModel.collection;

    const [
      submissionCount,
      accepted,
      verdictGroups,
      languageGroups,
      problemGroups,
      runtimes,
      events,
      recentRows,
    ] = await Promise.all([
      submissions.countDocuments(match),
      submissions.countDocuments({ ...match, verdict: Verdict.ACCEPTED }),
      submissions
        .aggregate<{ _id: string | null; count: number }>([
          { $match: match },
          {
            $group: {
              _id: { $ifNull: ["$verdict", "$status"] },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      submissions
        .aggregate<{ _id: string; count: number; accepted: number }>([
          { $match: match },
          {
            $group: {
              _id: "$language",
              count: { $sum: 1 },
              accepted: {
                $sum: {
                  $cond: [{ $eq: ["$verdict", Verdict.ACCEPTED] }, 1, 0],
                },
              },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      submissions
        .aggregate<{
          _id: string;
          attempts: number;
          accepted: number;
          bestMs: number | null;
          lastVerdict: string | null;
          lastAt: Date | null;
        }>([
          { $match: match },
          { $sort: { submittedAt: -1, _id: -1 } },
          {
            $group: {
              _id: "$problemId",
              attempts: { $sum: 1 },
              accepted: {
                $sum: {
                  $cond: [{ $eq: ["$verdict", Verdict.ACCEPTED] }, 1, 0],
                },
              },
              bestMs: {
                $min: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$verdict", Verdict.ACCEPTED] },
                        { $gt: ["$executionTimeMs", 0] },
                      ],
                    },
                    "$executionTimeMs",
                    "$$REMOVE",
                  ],
                },
              },
              lastVerdict: { $first: "$verdict" },
              lastAt: { $first: "$submittedAt" },
            },
          },
          { $sort: { attempts: -1 } },
          { $limit: 40 },
        ])
        .toArray(),
      submissions
        .find({
          ...match,
          verdict: Verdict.ACCEPTED,
          executionTimeMs: { $gt: 0 },
        })
        .project<{ executionTimeMs?: number }>({ executionTimeMs: 1 })
        .limit(5000)
        .toArray(),
      submissions
        .find({ ...match, submittedAt: { $gte: since } })
        .project<{ submittedAt?: Date }>({ submittedAt: 1 })
        .sort({ submittedAt: -1 })
        .limit(5000)
        .toArray(),
      submissions
        .find(match)
        .project<{
          _id: { toString(): string };
          problemId: string;
          language: string;
          verdict?: string | null;
          status?: string;
          executionTimeMs?: number;
          passedTestCases?: number;
          totalTestCases?: number;
          submittedAt?: Date;
        }>({
          problemId: 1,
          language: 1,
          verdict: 1,
          status: 1,
          executionTimeMs: 1,
          passedTestCases: 1,
          totalTestCases: 1,
          submittedAt: 1,
        })
        .sort({ submittedAt: -1, _id: -1 })
        .limit(12)
        .toArray(),
    ]);

    const problemIds = [
      ...new Set([
        ...problemGroups.map((group) => String(group._id)),
        ...recentRows.map((row) => String(row.problemId)),
      ]),
    ];
    const problemDocs = problemIds.length
      ? await ProblemModel.find({ id: { $in: problemIds } })
          .select("id slug title difficulty")
          .lean()
      : [];
    const problemsById = new Map(
      problemDocs.map((problem) => [String(problem.id), problem]),
    );

    const solvedIds = await submissions.distinct("problemId", {
      ...match,
      verdict: Verdict.ACCEPTED,
    });
    const solvedDocs = solvedIds.length
      ? await ProblemModel.find({ id: { $in: solvedIds.map(String) } })
          .select("difficulty")
          .lean()
      : [];
    const difficulty = { easy: 0, medium: 0, hard: 0 };
    for (const problem of solvedDocs) {
      const level = String(problem.difficulty);
      if (level === "easy" || level === "medium" || level === "hard") {
        difficulty[level] += 1;
      }
    }

    const times = runtimes
      .map((row) => Number(row.executionTimeMs))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    const medianMs = times.length
      ? times[Math.floor((times.length - 1) / 2)]
      : null;

    const describe = (id: string) => {
      const problem = problemsById.get(id);
      return {
        problemId: id,
        slug: problem?.slug ? String(problem.slug) : "",
        title: problem?.title ? String(problem.title) : `Problem ${id}`,
        difficulty: problem?.difficulty ? String(problem.difficulty) : "",
      };
    };

    return {
      submissions: submissionCount,
      accepted,
      solved: solvedIds.length,
      acceptanceRate: submissionCount
        ? Number(((accepted / submissionCount) * 100).toFixed(1))
        : 0,
      fastestMs: times[0] ?? null,
      medianMs,
      slowestMs: times[times.length - 1] ?? null,
      verdicts: verdictGroups.map((group) => ({
        label: group._id || "Pending",
        count: group.count,
      })),
      languages: languageGroups.map((group) => ({
        language: group._id,
        count: group.count,
        accepted: group.accepted,
      })),
      difficulty,
      problems: problemGroups.map((group) => ({
        ...describe(String(group._id)),
        attempts: group.attempts,
        accepted: group.accepted,
        bestMs: typeof group.bestMs === "number" ? group.bestMs : null,
        lastVerdict: group.lastVerdict,
        lastAt: group.lastAt ? new Date(group.lastAt).toISOString() : null,
      })),
      recent: recentRows.map((row) => ({
        id: String(row._id),
        ...describe(String(row.problemId)),
        language: String(row.language),
        verdict: row.verdict ? String(row.verdict) : null,
        status: String(row.status ?? "completed"),
        executionTimeMs: Number(row.executionTimeMs ?? 0),
        passedTestCases: Number(row.passedTestCases ?? 0),
        totalTestCases: Number(row.totalTestCases ?? 0),
        submittedAt: row.submittedAt
          ? new Date(row.submittedAt).toISOString()
          : new Date(0).toISOString(),
      })),
      timestamps: events
        .map((row) => row.submittedAt)
        .filter((value): value is Date => value instanceof Date)
        .map((value) => value.toISOString()),
    };
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
