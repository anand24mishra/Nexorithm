import { Queue } from "bullmq";
import { SubmissionModel } from "../models/Submission.model";
import {
  AsyncSubmissionRepository,
  MAX_ATTEMPTS,
} from "../repositories/AsyncSubmissionRepository";
import { enqueue } from "./queue";
import { metrics } from "../telemetry";
// The queued Mongo record is the durable outbox. Redis is reconstructible.
export async function reconcile(queue: Queue) {
  await new AsyncSubmissionRepository().recoverExpired();
  await SubmissionModel.updateMany(
    { status: "queued", workerAttempt: { $gte: MAX_ATTEMPTS } },
    {
      $set: {
        status: "failed",
        verdict: "System Error",
        completedAt: new Date(),
        errorCategory: "attempts_exhausted",
      },
    },
  );
  metrics.persisted.set(await SubmissionModel.estimatedDocumentCount());
  metrics.queueDepth.set(
    await SubmissionModel.countDocuments({
      status: { $in: ["queued", "running"] },
    }),
  );
  const rows = await SubmissionModel.find({ status: "queued" })
    .sort({ queuedAt: 1 })
    .limit(100)
    .select("_id requestId")
    .lean();
  for (const row of rows) {
    const id = String(row._id),
      job = await queue.getJob(id);
    if (job) {
      const state = await job.getState();
      if (state === "failed" || state === "completed") {
        await job.remove();
        await enqueue(queue, id, row.requestId ?? undefined);
      }
    } else await enqueue(queue, id, row.requestId ?? undefined);
  }
}
