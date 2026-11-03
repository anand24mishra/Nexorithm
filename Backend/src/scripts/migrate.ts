import "dotenv/config";
import mongoose from "mongoose";
import { SubmissionModel } from "../models/Submission.model";
import { ProblemModel } from "../models/Problem.model";
import { MongoProblemRepository } from "../repositories/MongoProblemRepository";
import { problemContract } from "../services/contracts";
import { seedProblems } from "../data/seedProblems";
import { logger } from "../telemetry";
export async function migrate() {
  const result = await SubmissionModel.updateMany(
    { status: { $exists: false } },
    [
      {
        $set: {
          status: "completed",
          queuedAt: "$submittedAt",
          completedAt: "$submittedAt",
          workerAttempt: 0,
        },
      },
    ],
    { updatePipeline: true },
  );
  const repo = new MongoProblemRepository();
  for (const problem of seedProblems)
    if (!(await repo.findById(problem.id)))
      await repo.upsert({ ...problem, execution: problemContract(problem) });
  const cursor = ProblemModel.find({
    "execution.functionName": { $exists: false },
  })
    .select("id")
    .cursor();
  let contracts = 0,
    unsupported = 0;
  for await (const row of cursor) {
    const problem = await repo.findById(row.id);
    if (!problem) continue;
    try {
      await ProblemModel.updateOne(
        { _id: row._id },
        { $set: { execution: problemContract(problem) } },
      );
      contracts++;
    } catch {
      unsupported++;
    }
  }
  await SubmissionModel.createIndexes();
  return { migratedSubmissions: result.modifiedCount, contracts, unsupported };
}
if (require.main === module)
  void (async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info({ operation: "migration", ...(await migrate()) });
    await mongoose.disconnect();
  })().catch(() => {
    logger.error({ operation: "migration", outcome: "failed" });
    process.exit(1);
  });
