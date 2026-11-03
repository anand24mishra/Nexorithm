import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SubmissionHistory } from "../src/components/SubmissionHistory/SubmissionHistory";
import { submissionHistoryApi } from "../src/api/submissionHistoryApi";
vi.mock("../src/api/submissionHistoryApi", () => ({
  submissionHistoryApi: { getPage: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("requests the next history page", async () => {
  vi.mocked(submissionHistoryApi.getPage).mockResolvedValue({
    submissions: [
      {
        id: "1",
        verdict: "Accepted",
        language: "python",
        submittedAt: new Date().toISOString(),
        executionTimeMs: 1,
        passedTestCases: 1,
        totalTestCases: 1,
        code: "x",
      },
    ] as never,
    page: 1,
    totalPages: 2,
    total: 21,
  });
  render(<SubmissionHistory />);
  await screen.findByText("Next");
  fireEvent.click(screen.getByText("Next"));
  await waitFor(() =>
    expect(submissionHistoryApi.getPage).toHaveBeenLastCalledWith(
      2,
      undefined,
      expect.any(AbortSignal),
    ),
  );
});
