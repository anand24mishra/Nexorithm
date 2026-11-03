import type { Submission, Language } from "../types";
import { fetchWithAuth } from "./authApi";
export const submissionApi = {
  async submit(
    code: string,
    language: Language,
    problemId: string,
    signal?: AbortSignal,
  ): Promise<{ submissionId: string; status: "queued" }> {
    const response = await fetchWithAuth("/submissions", {
      method: "POST",
      body: JSON.stringify({ code, language, problemId }),
      signal,
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Submission request failed" }));
      throw new Error(error.error || `Submission failed (${response.status})`);
    }
    return response.json();
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
