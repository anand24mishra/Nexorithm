import "dotenv/config";
import mongoose from "mongoose";
import { SubmissionModel } from "../models/Submission.model";
import { logger } from "../telemetry";
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
  await mongoose.connect(process.env.MONGODB_URI);
  const terminalStatuses = ["completed", "failed", "cancelled"] as const;
  const filter = {
    status: { $in: terminalStatuses },
    submittedAt: { $lt: new Date(Date.now() - 90 * 86400000) },
    code: { $ne: "[source expired]" },
  };
  const count = await SubmissionModel.countDocuments(filter);
  if (process.argv.includes("--apply"))
    await SubmissionModel.updateMany(filter, {
      $set: { code: "[source expired]" },
      $unset: { result: "" },
    });
  logger.info({
    operation: "retention",
    eligible: count,
    applied: process.argv.includes("--apply"),
  });
  await mongoose.disconnect();
}
void main().catch(() => {
  logger.error({ operation: "retention", outcome: "failed" });
  process.exit(1);
});
