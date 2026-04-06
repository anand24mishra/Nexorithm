import { Submission, Language, Verdict } from '../types';

export interface CreateSubmissionData {
  userId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
}

export interface ISubmissionRepository {
  create(data: CreateSubmissionData): Promise<Submission>;
  findByUser(userId: string): Promise<Submission[]>;
  findByUserAndProblem(userId: string, problemId: string): Promise<Submission[]>;
  findById(id: string): Promise<Submission | null>;
}
