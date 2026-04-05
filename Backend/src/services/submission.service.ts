import { JudgeService } from './judge.service';
import { ISubmissionRepository } from '../interfaces/ISubmissionRepository';
import { IProblemRepository } from '../interfaces/IProblemRepository';
import {
  Language,
  Verdict,
  SubmissionRequest,
  SubmissionResponse,
  Submission,
} from '../types';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class SubmissionService {
  constructor(
    private readonly judgeService: JudgeService,
    private readonly submissionRepo: ISubmissionRepository,
    private readonly problemRepo: IProblemRepository
  ) {}

  async submitCode(
    request: SubmissionRequest,
    userId = 'anonymous'
  ): Promise<SubmissionResponse> {
    // 1. Validate request
    if (!request.code || !request.code.trim()) {
      throw new ValidationError('Code is required');
    }

    if (
      !request.language ||
      !Object.values(Language).includes(request.language)
    ) {
      throw new ValidationError(
        `Unsupported language: ${request.language}. Supported: ${Object.values(Language).join(', ')}`
      );
    }

    if (!request.problemId) {
      throw new ValidationError('Problem ID is required');
    }

    // 2. Find problem
    const problem = await this.problemRepo.findById(request.problemId);
    if (!problem) {
      throw new NotFoundError(`Problem with ID "${request.problemId}"`);
    }

    if (problem.testCases.length === 0) {
      throw new ValidationError(
        'This problem has no test cases configured for execution'
      );
    }

    // 3. Judge
    const judgeResult = await this.judgeService.judge(
      request.code,
      request.language,
      problem.testCases
    );

    // 4. Persist submission
    await this.submissionRepo.create({
      userId,
      problemId: request.problemId,
      language: request.language,
      code: request.code,
      verdict: judgeResult.verdict,
      passedTestCases: judgeResult.passedCount,
      totalTestCases: judgeResult.totalCount,
      executionTimeMs: judgeResult.totalExecutionTimeMs,
    });

    // 5. Build response
    const lastResult = judgeResult.results[judgeResult.results.length - 1];
    return {
      verdict: judgeResult.verdict,
      passedCount: judgeResult.passedCount,
      totalCount: judgeResult.totalCount,
      stdout: lastResult?.actualOutput ?? '',
      stderr: lastResult?.stderr ?? '',
      executionTimeMs: judgeResult.totalExecutionTimeMs,
      results: judgeResult.results,
    };
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    return this.submissionRepo.findByUser(userId);
  }

  async getSubmissionsByUserAndProblem(userId: string, problemId: string): Promise<Submission[]> {
    // Requires findByUserAndProblem in repo which we added
    return this.submissionRepo.findByUserAndProblem(userId, problemId);
  }
}
