import { fetchWithAuth } from "./authApi";

export interface DashboardStats {
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  totalProblems: number;
  globalRank: number;
  percentile: number;
  acceptance: number;
  streak: number;
}

export interface DashboardRecentSubmission {
  id: string;
  title: string;
  status: "ACCEPTED" | "WRONG ANSWER" | "TLE";
  timestamp: string;
  language: string;
}

export interface DashboardRecommendation {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  acceptance: number;
}

export interface DashboardData {
  stats: DashboardStats;
  activityData: number[][];
  recentSubmissions: DashboardRecentSubmission[];
  recommendations: DashboardRecommendation[];
}

export const dashboardApi = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await fetchWithAuth("/dashboard");
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }
    return (await response.json()) as DashboardData;
  }
};
