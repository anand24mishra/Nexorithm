import type { Submission } from '../types';
import { fetchWithAuth } from './authApi';
export interface SubmissionPage { submissions: Submission[]; page: number; total: number; totalPages: number }
async function page(path: string, pageNumber = 1, signal?: AbortSignal): Promise<SubmissionPage> {
  const response = await fetchWithAuth(`${path}?page=${pageNumber}&limit=20`, { signal });
  if (response.status === 401 || response.status === 403) return { submissions: [], page: pageNumber, total: 0, totalPages: 0 };
  if (!response.ok) throw new Error('Could not load submission history. Please retry.');
  return response.json();
}
export const submissionHistoryApi = {
  getPage: (pageNumber: number, problemId?: string, signal?: AbortSignal) => page(problemId ? `/submissions/problem/${encodeURIComponent(problemId)}` : '/submissions', pageNumber, signal),
  getSubmissions: async () => (await page('/submissions')).submissions,
  getSubmissionsByProblem: async (id: string) => (await page(`/submissions/problem/${encodeURIComponent(id)}`)).submissions,
};
