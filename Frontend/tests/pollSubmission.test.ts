import { afterEach, describe, expect, it, vi } from "vitest";
import { pollSubmission, isTerminal } from "../src/hooks/pollSubmission";
import type { Submission } from "../src/types";
afterEach(() => vi.useRealTimers());
describe("submission polling", () => {
  it.each(["completed", "failed", "cancelled"] as const)(
    "recognizes terminal %s",
    (s) => expect(isTerminal(s)).toBe(true),
  );
  it("announces queue/running and stops on completion", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ status: "queued" })
      .mockResolvedValueOnce({ status: "running" })
      .mockResolvedValueOnce({ status: "completed" });
    const update = vi.fn();
    const row = await pollSubmission(
      "id",
      get,
      new AbortController().signal,
      update,
      1,
      1000,
    );
    expect(row.status).toBe("completed");
    expect(get).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenNthCalledWith(1, "Queued — waiting for a judge…");
    expect(update).toHaveBeenNthCalledWith(2, "Running your code…");
  });
  it("bounds status-fetch failures and retains id for recovery", async () => {
    const get = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(
      pollSubmission(
        "saved-id",
        get,
        new AbortController().signal,
        vi.fn(),
        1,
        1000,
      ),
    ).rejects.toThrow("saved-id");
    expect(get).toHaveBeenCalledTimes(3);
  });
  it("cancels on unmount/abandonment", async () => {
    const controller = new AbortController();
    controller.abort();
    const get = vi.fn();
    await expect(
      pollSubmission("id", get, controller.signal, vi.fn(), 1),
    ).rejects.toBeDefined();
    expect(get).not.toHaveBeenCalled();
  });
  it("bounds a stalled worker wait", async () => {
    await expect(
      pollSubmission(
        "id",
        async () => ({ status: "queued" }) as Submission,
        new AbortController().signal,
        vi.fn(),
        1,
        2,
      ),
    ).rejects.toThrow("longer than expected");
  });
});
