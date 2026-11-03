import { SubmissionStatus } from "../types";
const transitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  queued: ["running", "failed", "cancelled"],
  running: ["queued", "completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};
export const canTransition = (from: SubmissionStatus, to: SubmissionStatus) =>
  transitions[from].includes(to);
export const retryable = (category: string) => category === "infrastructure";
