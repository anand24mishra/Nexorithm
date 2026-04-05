

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

export interface ProblemListResponse {
  problems: ProblemListItem[];
  total: number;
  page: number;
  totalPages: number;
}



export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  stderr: string;
}

export interface SubmissionResult {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  results: TestCaseResult[];
  isSubmit?: boolean;
}



export interface WorkspaceState {
  code: string;
  language: Language;
  problemId: string;
  isRunning: boolean;
  isSubmitting: boolean;
  lastResult: SubmissionResult | null;
  consoleOutput: string;
  activeTab: 'testcase' | 'result';
  fontSize: number;
  isFullscreen: boolean;
}

export type WorkspaceAction =
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_PROBLEM'; payload: { problemId: string; code: string } }
  | { type: 'RUN_START' }
  | { type: 'RUN_SUCCESS'; payload: SubmissionResult }
  | { type: 'RUN_ERROR'; payload: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: SubmissionResult }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'testcase' | 'result' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'RESET_CODE'; payload: string };

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  submittedAt: string | Date;
}
