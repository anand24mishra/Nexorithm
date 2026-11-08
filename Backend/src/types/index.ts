export enum Language {
  JAVASCRIPT = "javascript",
  PYTHON = "python",
}

export enum Verdict {
  ACCEPTED = "Accepted",
  WRONG_ANSWER = "Wrong Answer",
  RUNTIME_ERROR = "Runtime Error",
  TIME_LIMIT_EXCEEDED = "Time Limit Exceeded",
  COMPILE_ERROR = "Compile Error",
  MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded",
  OUTPUT_LIMIT_EXCEEDED = "Output Limit Exceeded",
  SYSTEM_ERROR = "System Error",
  CANCELLED = "Cancelled",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal?: string | null;
  memoryLimitExceeded?: boolean;
  outputLimitExceeded?: boolean;
  infrastructureError?: boolean;
  compilationError?: boolean;
  timedOut: boolean;
  executionTimeMs: number;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  stderr: string;
}

export interface JudgeResult {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
  totalExecutionTimeMs: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface StarterCode {
  javascript: string;
  python: string;
}

export interface NexorithmProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  content: string;
  tags: string[];
  execution?: ExecutionContract;
  starterCode: StarterCode;
  testCases: TestCase[];
  sampleInput: string;
  sampleOutput: string;
  hints: string[];
  acRate: number;
}

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  acRate: number;
}

export interface ProblemListParams {
  page?: number;
  limit?: number;
  difficulty?: Difficulty;
  tags?: string[];
  search?: string;
}

export interface ProblemListResponse {
  problems: ProblemListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SubmissionRequest {
  code: string;
  language: Language;
  problemId: string;
}

export interface SubmissionResponse {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  results: TestCaseResult[];
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  submittedAt: Date;
  status?: SubmissionStatus;
  queuedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  queueWaitMs?: number;
  workerAttempt?: number;
  leaseToken?: string;
  leaseExpiresAt?: Date;
  result?: SubmissionResponse;
  errorCategory?: string;
  requestId?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: "user" | "admin";
}

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  googleClientId: string;
  useDb: boolean;
  nodeEnv: string;
}

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
  problemId: string;
  slug: string;
  title: string;
  status: "ACCEPTED" | "WRONG ANSWER" | "TLE";
  timestamp: string;
  language: string;
}

export interface DashboardRecommendation {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  acceptance: number;
}

export interface DashboardData {
  stats: DashboardStats;
  activityData: number[][];
  activityTimestamps: string[];
  recentSubmissions: DashboardRecentSubmission[];
  recommendations: DashboardRecommendation[];
}

export type SubmissionStatus =
  "queued" | "running" | "completed" | "failed" | "cancelled";
export interface ExecutionContract {
  functionName: string;
  inputMode?: "json-args" | "legacy-lines";
  comparison?: "json" | "exact" | "trim" | "float";
  tolerance?: number;
}
