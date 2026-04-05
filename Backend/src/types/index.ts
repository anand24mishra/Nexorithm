// ─── Enums ─────────────────────────────────────────────────────────────────────

export enum Language {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
}

export enum Verdict {
  ACCEPTED = 'Accepted',
  WRONG_ANSWER = 'Wrong Answer',
  RUNTIME_ERROR = 'Runtime Error',
  TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded',
  COMPILE_ERROR = 'Compile Error',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// ─── Execution ─────────────────────────────────────────────────────────────────

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
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

// ─── Problem ───────────────────────────────────────────────────────────────────

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

// ─── Submission ────────────────────────────────────────────────────────────────

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
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

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
  role: 'user' | 'admin';
}

// ─── Config ────────────────────────────────────────────────────────────────────

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  useDb: boolean;
  nodeEnv: string;
}
