import mongoose from "mongoose";
import { Verdict } from "../types";
const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    problemId: { type: String, required: true },
    language: { type: String, enum: ["python", "javascript"], required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
    },
    verdict: { type: String, enum: Object.values(Verdict), default: null },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 },
    queueWaitMs: Number,
    submittedAt: { type: Date, default: Date.now },
    queuedAt: { type: Date, default: Date.now },
    startedAt: Date,
    completedAt: Date,
    workerAttempt: { type: Number, default: 0 },
    leaseToken: String,
    leaseExpiresAt: Date,
    result: mongoose.Schema.Types.Mixed,
    requestId: String,
    errorCategory: String,
  },
  { timestamps: true },
);
schema.index({ userId: 1, submittedAt: -1, _id: -1 });
schema.index({ userId: 1, problemId: 1, submittedAt: -1, _id: -1 });
schema.index({ status: 1, queuedAt: 1 });
schema.index({ status: 1, leaseExpiresAt: 1 });
export const SubmissionModel = mongoose.model("Submission", schema);
