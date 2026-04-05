import { ExecutorFactory } from './executorFactory';
import {
  Language,
  Verdict,
  JudgeResult,
  TestCase,
  TestCaseResult,
} from '../types';

export class JudgeService {
  async judge(
    code: string,
    language: Language,
    testCases: TestCase[]
  ): Promise<JudgeResult> {
    const executor = ExecutorFactory.getExecutor(language);
    const results: TestCaseResult[] = [];
    let passedCount = 0;
    let totalExecutionTimeMs = 0;
    let finalVerdict: Verdict = Verdict.ACCEPTED;

    for (const tc of testCases) {
      const execResult = await executor.execute(code, tc.input);
      totalExecutionTimeMs += execResult.executionTimeMs;

      const actualOutput = execResult.stdout.trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      if (passed) {
        passedCount++;
      }

      const testCaseResult: TestCaseResult = {
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        executionTimeMs: execResult.executionTimeMs,
        stderr: execResult.stderr,
      };

      results.push(testCaseResult);

      
      if (!passed && finalVerdict === Verdict.ACCEPTED) {
        if (execResult.timedOut) {
          finalVerdict = Verdict.TIME_LIMIT_EXCEEDED;
        } else if (execResult.exitCode !== 0) {
          finalVerdict = Verdict.RUNTIME_ERROR;
        } else {
          finalVerdict = Verdict.WRONG_ANSWER;
        }
      }

      
      if (execResult.timedOut || (execResult.exitCode !== 0 && !passed)) {
        break;
      }
    }

    return {
      verdict: finalVerdict,
      passedCount,
      totalCount: testCases.length,
      results,
      totalExecutionTimeMs,
    };
  }
}
