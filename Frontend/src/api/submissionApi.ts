import type {
  Submission,
  SubmissionResult,
  Language,
  TestCaseResult,
} from "../types";
import { Verdict } from "../types";
import { fetchWithAuth, getAuthToken } from "./authApi";

const SIGN_IN = "Sign in to submit your code.";

export type SubmitAck =
  | { mode: "queued"; submissionId: string }
  | { mode: "result"; result: SubmissionResult };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function interpretSubmitBody(body: unknown): SubmitAck | null {
  const row = asRecord(body);
  if (!row) return null;
  const nested = asRecord(row.result);
  const source = nested && typeof nested.verdict === "string" ? nested : row;
  if (typeof source.verdict === "string" && source.verdict) {
    const results = Array.isArray(source.results)
      ? (source.results as TestCaseResult[])
      : [];
    return {
      mode: "result",
      result: {
        verdict: source.verdict as Verdict,
        passedCount: Number(source.passedCount ?? row.passedTestCases ?? 0),
        totalCount: Number(source.totalCount ?? row.totalTestCases ?? 0),
        stdout: String(source.stdout ?? ""),
        stderr: String(source.stderr ?? ""),
        executionTimeMs: Number(
          source.executionTimeMs ?? row.executionTimeMs ?? 0,
        ),
        results,
      },
    };
  }
  const explicit = row.submissionId;
  if (typeof explicit === "string" && explicit && explicit !== "undefined") {
    return { mode: "queued", submissionId: explicit };
  }
  const id = row.id;
  if (
    typeof id === "string" &&
    id &&
    id !== "undefined" &&
    (row.status === "queued" || row.status === "running")
  ) {
    return { mode: "queued", submissionId: id };
  }
  return null;
}

export const submissionApi = {
  async submit(
    code: string,
    language: Language,
    problemId: string,
    signal?: AbortSignal,
  ): Promise<SubmitAck> {
    const response = await fetchWithAuth("/submissions", {
      method: "POST",
      body: JSON.stringify({ code, language, problemId }),
      signal,
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Submission request failed" }));
      if (
        response.status === 401 ||
        response.status === 403 ||
        !getAuthToken()
      ) {
        throw new Error(SIGN_IN);
      }
      throw new Error(error.error || `Submission failed (${response.status})`);
    }
    const ack = interpretSubmitBody(await response.json());
    if (ack) return ack;
    if (!getAuthToken()) throw new Error(SIGN_IN);
    throw new Error("Submission response did not include an id.");
  },
  async get(id: string, signal?: AbortSignal): Promise<Submission> {
    const response = await fetchWithAuth(
      `/submissions/${encodeURIComponent(id)}`,
      { signal },
    );
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Sign in again to check your submission."
          : "Could not fetch submission status.",
      );
    return response.json();
  },
};
