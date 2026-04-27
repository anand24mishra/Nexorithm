import { fetchWithAuth, API_BASE } from "./authApi";
import type { ProblemListItem, Submission } from "../types";

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

function toStatusLabel(verdict: string): "ACCEPTED" | "WRONG ANSWER" | "TLE" {
  const v = String(verdict).toLowerCase();
  if (v.includes("accepted")) return "ACCEPTED";
  if (v.includes("time limit")) return "TLE";
  return "WRONG ANSWER";
}

function formatTimestamp(input: string | Date): string {
  if (!input) return "just now";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "just now";
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function calculateStreak(submissions: Submission[]): number {
  const uniqueDays = new Set<string>();
  for (const s of submissions) {
    const d = new Date(s.submittedAt);
    if (!Number.isNaN(d.getTime())) {
      uniqueDays.add(d.toISOString().split("T")[0]);
    }
  }

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().split("T")[0];
    if (!uniqueDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildHeatmap(submissions: Submission[]): number[][] {
  const countsByDate = new Map<string, number>();
  for (const s of submissions) {
    if (!s.submittedAt) continue;
    const d = new Date(s.submittedAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().split("T")[0];
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
  }

  const weeks = 53;
  const daysPerWeek = 7;
  const grid: number[][] = [];
  const now = new Date();

  for (let w = 0; w < weeks; w += 1) {
    const week: number[] = [];
    for (let d = 0; d < daysPerWeek; d += 1) {
      const offset = (weeks - 1 - w) * daysPerWeek + (daysPerWeek - 1 - d);
      const cellDate = new Date(now);
      cellDate.setDate(now.getDate() - offset);
      const key = cellDate.toISOString().split("T")[0];
      const count = countsByDate.get(key) || 0;
      const intensity =
        count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4;
      week.push(intensity);
    }
    grid.push(week);
  }

  return grid;
}

async function buildDashboardFromLegacyEndpoints(): Promise<DashboardData> {
  const submissionsResponse = await fetchWithAuth("/submissions");
  if (!submissionsResponse.ok) {
    throw new Error("Failed to fetch submissions for dashboard fallback");
  }
  const submissions = (await submissionsResponse.json()) as Submission[];

  const problemsResponse = await fetch(`${API_BASE}/problems?page=1&limit=1000`);
  if (!problemsResponse.ok) {
    throw new Error("Failed to fetch problems for dashboard fallback");
  }
  const problemsJson = (await problemsResponse.json()) as { problems?: ProblemListItem[] };
  const problems = problemsJson.problems ?? [];

  const problemMap = new Map(problems.map((p) => [p.id, p]));
  const accepted = submissions.filter((s) => String(s.verdict).toLowerCase() === "accepted");
  const solvedIds = new Set(accepted.map((s) => s.problemId));

  let easy = 0;
  let medium = 0;
  let hard = 0;

  solvedIds.forEach((id) => {
    const p = problemMap.get(id);
    if (!p) return;
    const d = String(p.difficulty).toLowerCase();
    if (d === "easy") easy += 1;
    if (d === "medium") medium += 1;
    if (d === "hard") hard += 1;
  });

  const solved = solvedIds.size;
  const acceptance = submissions.length
    ? Number(((accepted.length / submissions.length) * 100).toFixed(1))
    : 0;

  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(String(b.submittedAt)).getTime() - new Date(String(a.submittedAt)).getTime()
  );

  const recentSubmissions: DashboardRecentSubmission[] = sortedSubmissions
    .slice(0, 6)
    .map((s) => {
      const p = problemMap.get(s.problemId);
      return {
        id: s.id,
        title: p?.title || `Problem ${s.problemId}`,
        status: toStatusLabel(String(s.verdict)),
        timestamp: formatTimestamp(s.submittedAt),
        language: String(s.language || "").toUpperCase(),
      };
    });

  const unsolved = problems.filter((p) => !solvedIds.has(p.id));
  const byDifficulty = {
    easy: unsolved.filter((p) => String(p.difficulty).toLowerCase() === "easy"),
    medium: unsolved.filter((p) => String(p.difficulty).toLowerCase() === "medium"),
    hard: unsolved.filter((p) => String(p.difficulty).toLowerCase() === "hard"),
  };

  const picks = [byDifficulty.easy[0], byDifficulty.medium[0], byDifficulty.hard[0]].filter(Boolean) as ProblemListItem[];
  const recommendations: DashboardRecommendation[] = picks.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: String(p.difficulty).toUpperCase() as "EASY" | "MEDIUM" | "HARD",
    tags: (p.tags || []).slice(0, 3),
    acceptance: Number((p.acRate || 0).toFixed(1)),
  }));

  return {
    stats: {
      solved,
      easy,
      medium,
      hard,
      totalProblems: problems.length,
      globalRank: Math.max(1, 5000 - solved * 12),
      percentile: Number(Math.max(0.2, 25 - solved * 0.05).toFixed(1)),
      acceptance,
      streak: calculateStreak(submissions),
    },
    activityData: buildHeatmap(submissions),
    recentSubmissions,
    recommendations,
  };
}

export const dashboardApi = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await fetchWithAuth("/dashboard");
    if (response.status === 404) {
      return buildDashboardFromLegacyEndpoints();
    }
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }
    return (await response.json()) as DashboardData;
  }
};
