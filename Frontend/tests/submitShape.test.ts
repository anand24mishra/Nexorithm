import { expect, it } from "vitest";
import { interpretSubmitBody } from "../src/api/submissionApi";
import { normalizeSubmissionPage } from "../src/api/submissionHistoryApi";
import { Verdict } from "../src/types";

it("treats a finished verdict as the result instead of an id", () => {
  const ack = interpretSubmitBody({
    verdict: Verdict.WRONG_ANSWER,
    passedCount: 1,
    totalCount: 3,
    stdout: "",
    stderr: "nope",
    executionTimeMs: 12,
    results: [],
  });
  expect(ack).toEqual({
    mode: "result",
    result: {
      verdict: Verdict.WRONG_ANSWER,
      passedCount: 1,
      totalCount: 3,
      stdout: "",
      stderr: "nope",
      executionTimeMs: 12,
      results: [],
    },
  });
});

it("keeps the queued submission id from the async contract", () => {
  expect(
    interpretSubmitBody({ submissionId: "abc", status: "queued" }),
  ).toEqual({ mode: "queued", submissionId: "abc" });
});

it("reads a raw submission array as one history page", () => {
  const page = normalizeSubmissionPage(
    [{ id: "1", verdict: "Accepted" }],
    1,
  );
  expect(page.submissions).toHaveLength(1);
  expect(page.totalPages).toBe(1);
});

it("keeps a paged history object", () => {
  const page = normalizeSubmissionPage(
    { submissions: [], page: 2, total: 0, totalPages: 3 },
    2,
  );
  expect(page.totalPages).toBe(3);
});
