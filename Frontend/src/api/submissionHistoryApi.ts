import type { Submission } from '../types';

import { fetchWithAuth } from './authApi';

export const submissionHistoryApi = {
  getSubmissions: async (): Promise<Submission[]> => {
    const response = await fetchWithAuth('/submissions');
    if (response.status === 401 || response.status === 403) return [];
    if (!response.ok) throw new Error('Failed to fetch submissions');
    return response.json() as Promise<Submission[]>;
  },

  getSubmissionsByProblem: async (problemId: string): Promise<Submission[]> => {
    const response = await fetchWithAuth(`/submissions/problem/${problemId}`);
    if (response.status === 401 || response.status === 403) return [];
    if (!response.ok) throw new Error('Failed to fetch problem submissions');
    return response.json() as Promise<Submission[]>;
  },
};
