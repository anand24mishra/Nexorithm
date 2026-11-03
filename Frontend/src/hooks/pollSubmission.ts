import type { Submission } from "../types";
export const isTerminal = (status: Submission["status"]) =>
  status === "completed" || status === "failed" || status === "cancelled";
export async function pollSubmission(
  id: string,
  get: (id: string, signal: AbortSignal) => Promise<Submission>,
  signal: AbortSignal,
  update: (message: string) => void,
  interval = 1500,
  maxWait = 180000,
): Promise<Submission> {
  if (!id) throw new Error("Sign in to submit your code.");
  const start = Date.now();
  let errors = 0;
  while (Date.now() - start < maxWait) {
    signal.throwIfAborted();
    try {
      const row = await get(id, signal);
      errors = 0;
      if (isTerminal(row.status)) return row;
      update(
        row.status === "running"
          ? "Running your code…"
          : "Queued — waiting for a judge…",
      );
    } catch {
      signal.throwIfAborted();
      errors++;
      if (errors >= 3)
        throw new Error(
          `Status unavailable. Submission ${id} is saved; check history or retry status.`,
        );
      update("Connection interrupted. Retrying status…");
    }
    await new Promise<void>((resolve, reject) => {
      const aborted = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(
        () => {
          signal.removeEventListener("abort", aborted);
          resolve();
        },
        interval * Math.max(1, errors),
      );
      signal.addEventListener("abort", aborted, { once: true });
    });
  }
  throw new Error(
    `Judge is taking longer than expected. Submission ${id} is saved; check history or retry status.`,
  );
}
