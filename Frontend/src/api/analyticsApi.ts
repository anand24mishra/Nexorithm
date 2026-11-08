import { API_BASE, fetchWithAuth } from "./authApi";

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

const SIGN_IN = "Sign in to see analytics.";
const LOAD_FAILED = "Analytics could not be loaded. Try again.";
const WINDOW_MS = 400 * 24 * 60 * 60 * 1000;

interface SavedSubmission {
  id: string;
  problemId: string;
  language: string;
  verdict: string | null;
  status: string;
  executionTimeMs: number;
  passedTestCases: number;
  totalTestCases: number;
  submittedAt: string;
}

interface ProblemBrief {
  slug: string;
  title: string;
  difficulty: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function savedSubmission(value: unknown): SavedSubmission | null {
  const row = asRecord(value);
  if (!row) return null;
  const problemId = row.problemId;
  if (typeof problemId !== "string" || !problemId) return null;
  const id = row.id ?? row._id;
  const submittedAt = row.submittedAt;
  return {
    id: typeof id === "string" && id ? id : "",
    problemId,
    language: typeof row.language === "string" ? row.language : "",
    verdict: typeof row.verdict === "string" && row.verdict ? row.verdict : null,
    status: typeof row.status === "string" && row.status ? row.status : "completed",
    executionTimeMs: Number(row.executionTimeMs ?? 0),
    passedTestCases: Number(row.passedTestCases ?? 0),
    totalTestCases: Number(row.totalTestCases ?? 0),
    submittedAt: typeof submittedAt === "string" ? submittedAt : "",
  };
}

function submissionRows(body: unknown): SavedSubmission[] {
  const list = Array.isArray(body)
    ? body
    : asRecord(body) && Array.isArray(asRecord(body)?.submissions)
      ? (asRecord(body)?.submissions as unknown[])
      : null;
  if (!list) throw new Error(LOAD_FAILED);
  return list.map(savedSubmission).filter((row): row is SavedSubmission => row !== null);
}

export function reportFromSubmissions(
  rows: SavedSubmission[],
  problems: Map<string, ProblemBrief>,
): AnalyticsReport {
  const acceptedRows = rows.filter((row) => row.verdict === "Accepted");
  const verdictCounts = new Map<string, number>();
  const languageCounts = new Map<string, { count: number; accepted: number }>();
  for (const row of rows) {
    const label = row.verdict || row.status || "Pending";
    verdictCounts.set(label, (verdictCounts.get(label) ?? 0) + 1);
    const language = row.language || "unknown";
    const current = languageCounts.get(language) ?? { count: 0, accepted: 0 };
    current.count += 1;
    if (row.verdict === "Accepted") current.accepted += 1;
    languageCounts.set(language, current);
  }

  const describe = (id: string) => {
    const problem = problems.get(id);
    return {
      problemId: id,
      slug: problem?.slug ?? "",
      title: problem?.title ?? `Problem ${id}`,
      difficulty: problem?.difficulty ?? "",
    };
  };

  const byProblem = new Map<
    string,
    {
      attempts: number;
      accepted: number;
      bestMs: number | null;
      lastVerdict: string | null;
      lastAt: string | null;
      lastStamp: number;
    }
  >();
  for (const row of rows) {
    const stamp = Date.parse(row.submittedAt);
    const current = byProblem.get(row.problemId) ?? {
      attempts: 0,
      accepted: 0,
      bestMs: null,
      lastVerdict: null,
      lastAt: null,
      lastStamp: Number.NEGATIVE_INFINITY,
    };
    current.attempts += 1;
    if (row.verdict === "Accepted") {
      current.accepted += 1;
      if (Number.isFinite(row.executionTimeMs) && row.executionTimeMs > 0) {
        current.bestMs =
          current.bestMs == null
            ? row.executionTimeMs
            : Math.min(current.bestMs, row.executionTimeMs);
      }
    }
    if (Number.isFinite(stamp) && stamp >= current.lastStamp) {
      current.lastStamp = stamp;
      current.lastVerdict = row.verdict;
      current.lastAt = new Date(stamp).toISOString();
    }
    byProblem.set(row.problemId, current);
  }

  const solvedIds = [
    ...new Set(acceptedRows.map((row) => row.problemId)),
  ];
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  for (const id of solvedIds) {
    const level = problems.get(id)?.difficulty;
    if (level === "easy" || level === "medium" || level === "hard") difficulty[level] += 1;
  }

  const times = acceptedRows
    .map((row) => row.executionTimeMs)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  const since = Date.now() - WINDOW_MS;
  const recent = [...rows].sort((a, b) => {
    const delta = Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
    if (delta !== 0 && Number.isFinite(delta)) return delta;
    return b.id.localeCompare(a.id);
  });

  return {
    submissions: rows.length,
    accepted: acceptedRows.length,
    solved: solvedIds.length,
    acceptanceRate: rows.length
      ? Number(((acceptedRows.length / rows.length) * 100).toFixed(1))
      : 0,
    fastestMs: times[0] ?? null,
    medianMs: times.length ? times[Math.floor((times.length - 1) / 2)] : null,
    slowestMs: times.length ? times[times.length - 1] : null,
    verdicts: [...verdictCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    languages: [...languageCounts.entries()]
      .map(([language, counts]) => ({ language, ...counts }))
      .sort((a, b) => b.count - a.count),
    difficulty,
    problems: [...byProblem.entries()]
      .sort((a, b) => b[1].attempts - a[1].attempts)
      .slice(0, 40)
      .map(([id, group]) => ({
        ...describe(id),
        attempts: group.attempts,
        accepted: group.accepted,
        bestMs: group.bestMs,
        lastVerdict: group.lastVerdict,
        lastAt: group.lastAt,
      })),
    recent: recent.slice(0, 12).map((row) => ({
      ...describe(row.problemId),
      id: row.id,
      language: row.language,
      verdict: row.verdict,
      status: row.status,
      executionTimeMs: Number.isFinite(row.executionTimeMs) ? row.executionTimeMs : 0,
      passedTestCases: Number.isFinite(row.passedTestCases) ? row.passedTestCases : 0,
      totalTestCases: Number.isFinite(row.totalTestCases) ? row.totalTestCases : 0,
      submittedAt: Number.isFinite(Date.parse(row.submittedAt))
        ? new Date(row.submittedAt).toISOString()
        : new Date(0).toISOString(),
    })),
    timestamps: rows
      .map((row) => Date.parse(row.submittedAt))
      .filter((stamp) => Number.isFinite(stamp) && stamp >= since)
      .map((stamp) => new Date(stamp).toISOString()),
  };
}

async function problemIndex(): Promise<Map<string, ProblemBrief>> {
  const index = new Map<string, ProblemBrief>();
  try {
    for (let page = 1; page <= 10; page += 1) {
      const response = await fetch(`${API_BASE}/problems?page=${page}&limit=100`);
      if (!response.ok) break;
      const body: unknown = await response.json();
      const record = asRecord(body);
      const problems = Array.isArray(body)
        ? body
        : record && Array.isArray(record.problems)
          ? record.problems
          : [];
      for (const item of problems) {
        const problem = asRecord(item);
        if (!problem || problem.id == null) continue;
        index.set(String(problem.id), {
          slug: typeof problem.slug === "string" ? problem.slug : "",
          title: typeof problem.title === "string" ? problem.title : "",
          difficulty: typeof problem.difficulty === "string" ? problem.difficulty : "",
        });
      }
      const totalPages = record && typeof record.totalPages === "number" ? record.totalPages : 1;
      if (!Array.isArray(problems) || problems.length === 0 || page >= totalPages) break;
    }
  } catch {
    return index;
  }
  return index;
}

async function savedSubmissions(problemId?: string): Promise<SavedSubmission[]> {
  const path = problemId
    ? `/submissions/problem/${encodeURIComponent(problemId)}`
    : "/submissions";
  const response = await fetchWithAuth(path);
  if (response.status === 401 || response.status === 403) throw new Error(SIGN_IN);
  if (!response.ok) throw new Error(LOAD_FAILED);
  return submissionRows(await response.json());
}

export const analyticsApi = {
  async get(problemId?: string): Promise<AnalyticsReport> {
    const query = problemId ? `?problemId=${encodeURIComponent(problemId)}` : "";
    const response = await fetchWithAuth(`/submissions/analytics${query}`);
    if (response.status === 401 || response.status === 403) throw new Error(SIGN_IN);
    // The deployed API predates this route and answers 404. The submissions
    // list on that host is the same saved record.
    if (response.status === 404) {
      const [rows, problems] = await Promise.all([
        savedSubmissions(problemId),
        problemIndex(),
      ]);
      return reportFromSubmissions(rows, problems);
    }
    if (!response.ok) throw new Error(LOAD_FAILED);
    return (await response.json()) as AnalyticsReport;
  },
};
