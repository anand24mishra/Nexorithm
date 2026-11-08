import { expect, it } from "vitest";
import {
  formatRuntimeMs,
  verdictLabel,
} from "../src/hooks/useSubmissionHistory";
import { normalizeSubmissionPage } from "../src/api/submissionHistoryApi";

it("reads a raw submission array as one history page", () => {
  const page = normalizeSubmissionPage([{ id: "1", verdict: "Accepted" }], 1);
  expect(page.submissions).toHaveLength(1);
  expect(page.page).toBe(1);
  expect(page.total).toBe(1);
  expect(page.totalPages).toBe(1);
});

it("keeps a paged history object", () => {
  const page = normalizeSubmissionPage(
    { submissions: [], page: 2, total: 0, totalPages: 3 },
    2,
  );
  expect(page.page).toBe(2);
  expect(page.total).toBe(0);
  expect(page.totalPages).toBe(3);
  expect(page.submissions).toEqual([]);
});

it("throws when the submissions payload is not a page", () => {
  expect(() => normalizeSubmissionPage({ total: 4 }, 1)).toThrowError(
    "Unexpected submissions response",
  );
  expect(() => normalizeSubmissionPage({ submissions: null }, 1)).toThrowError(
    "Unexpected submissions response",
  );
  expect(() => normalizeSubmissionPage(null, 1)).toThrowError(
    "Unexpected submissions response",
  );
});

it("keeps a zero runtime and does not treat a failed run as queued", () => {
  expect(formatRuntimeMs(0)).toBe("0 ms");
  expect(formatRuntimeMs(null)).toBeNull();
  expect(verdictLabel({ verdict: "Wrong Answer", status: "failed" })).toBe(
    "Wrong Answer",
  );
  expect(verdictLabel({ verdict: null, status: "failed" })).toBe("Failed");
  expect(verdictLabel({ verdict: null, status: "cancelled" })).toBe(
    "Cancelled",
  );
  expect(verdictLabel({ verdict: null, status: "queued" })).toBe("Queued");
  expect(verdictLabel({ verdict: "Accepted", status: "completed" })).toBe(
    "Accepted",
  );
});
