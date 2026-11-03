import type { Submission } from "../types";
import { fetchWithAuth } from "./authApi";
export interface SubmissionPage {
  submissions: Submission[];
  page: number;
  total: number;
  totalPages: number;
}

export function normalizeSubmissionPage(
  body: unknown,
  pageNumber: number,
): SubmissionPage {
  if (Array.isArray(body)) {
    const submissions = body as Submission[];
    return {
      submissions,
      page: pageNumber,
      total: submissions.length,
      totalPages: submissions.length ? 1 : 0,
    };
  }
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as SubmissionPage).submissions)
  ) {
    const pageBody = body as SubmissionPage;
    return {
      submissions: pageBody.submissions,
      page: pageBody.page ?? pageNumber,
      total: pageBody.total ?? pageBody.submissions.length,
      totalPages:
        pageBody.totalPages ?? (pageBody.submissions.length ? 1 : 0),
    };
  }
  return { submissions: [], page: pageNumber, total: 0, totalPages: 0 };
}

async function page(
  path: string,
  pageNumber = 1,
  signal?: AbortSignal,
): Promise<SubmissionPage> {
  const response = await fetchWithAuth(`${path}?page=${pageNumber}&limit=20`, {
    signal,
  });
  if (response.status === 401 || response.status === 403)
    return { submissions: [], page: pageNumber, total: 0, totalPages: 0 };
  if (!response.ok)
    throw new Error("Could not load submission history. Please retry.");
  return normalizeSubmissionPage(await response.json(), pageNumber);
}
export const submissionHistoryApi = {
  getPage: (pageNumber: number, problemId?: string, signal?: AbortSignal) =>
    page(
      problemId
        ? `/submissions/problem/${encodeURIComponent(problemId)}`
        : "/submissions",
      pageNumber,
      signal,
    ),
  getSubmissions: async () => (await page("/submissions")).submissions,
  getSubmissionsByProblem: async (id: string) =>
    (await page(`/submissions/problem/${encodeURIComponent(id)}`)).submissions,
};
