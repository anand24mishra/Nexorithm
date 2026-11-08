import { fetchWithAuth } from "./authApi";

export interface AnalyticsProblem {
  problemId: string;
  slug: string;
  title: string;
  difficulty: string;
  attempts: number;
  accepted: number;
  bestMs: number | null;
  lastVerdict: string | null;
  lastAt: string | null;
}

export interface AnalyticsRecent {
  id: string;
  problemId: string;
  slug: string;
  title: string;
  difficulty: string;
  language: string;
  verdict: string | null;
  status: string;
  executionTimeMs: number;
  passedTestCases: number;
  totalTestCases: number;
  submittedAt: string;
}

export interface AnalyticsReport {
  submissions: number;
  accepted: number;
  solved: number;
  acceptanceRate: number;
  fastestMs: number | null;
  medianMs: number | null;
  slowestMs: number | null;
  verdicts: { label: string; count: number }[];
  languages: { language: string; count: number; accepted: number }[];
  difficulty: { easy: number; medium: number; hard: number };
  problems: AnalyticsProblem[];
  recent: AnalyticsRecent[];
  timestamps: string[];
}

export const analyticsApi = {
  async get(problemId?: string): Promise<AnalyticsReport> {
    const query = problemId ? `?problemId=${encodeURIComponent(problemId)}` : "";
    const response = await fetchWithAuth(`/submissions/analytics${query}`);
    if (response.status === 401 || response.status === 403) {
      throw new Error("Sign in to see analytics.");
    }
    if (!response.ok) throw new Error("Analytics could not be loaded. Try again.");
    return (await response.json()) as AnalyticsReport;
  },
};
