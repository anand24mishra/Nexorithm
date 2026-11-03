import { ExecutorFactory } from "./executorFactory";
import { IExecutor } from "../interfaces/IExecutor";
import {
  Language,
  Verdict,
  JudgeResult,
  TestCase,
  TestCaseResult,
  ExecutionContract,
} from "../types";
import { compareOutput } from "./comparison";
import { SandboxOwnership } from "./sandboxLifecycle";
export class JudgeService {
  constructor(
    private readonly factory: (
      language: Language,
    ) => IExecutor = ExecutorFactory.getExecutor,
  ) {}
  async judge(
    code: string,
    language: Language,
    testCases: TestCase[],
    contract: ExecutionContract,
    ownership?: SandboxOwnership,
  ): Promise<JudgeResult> {
    if (!testCases.length) throw new Error("No authoritative test cases");
    const executor = this.factory(language);
    const results: TestCaseResult[] = [];
    let passedCount = 0,
      totalExecutionTimeMs = 0,
      verdict = Verdict.ACCEPTED;
    const suiteStarted = Date.now();
    for (const tc of testCases) {
      if (Date.now() - suiteStarted >= 60000) {
        verdict = Verdict.TIME_LIMIT_EXCEEDED;
        break;
      }
      const result = await executor.execute(
        code,
        tc.input,
        undefined,
        contract,
        ownership,
      );
      totalExecutionTimeMs += result.executionTimeMs;
      if (result.infrastructureError)
        throw new Error("Sandbox infrastructure failure");
      // A wall-clock kill stays a timeout unless the runtime reported OOM.
      // A program that only tried to allocate memory is not relabeled.
      const failure = result.outputLimitExceeded
        ? Verdict.OUTPUT_LIMIT_EXCEEDED
        : result.memoryLimitExceeded
          ? Verdict.MEMORY_LIMIT_EXCEEDED
          : result.timedOut
            ? Verdict.TIME_LIMIT_EXCEEDED
            : result.compilationError
              ? Verdict.COMPILE_ERROR
              : result.exitCode !== 0
                ? Verdict.RUNTIME_ERROR
                : undefined;
      const passed =
        !failure && compareOutput(result.stdout, tc.expectedOutput, contract);
      if (passed) passedCount++;
      // Never persist hidden inputs, expected outputs, stderr or user-controlled output.
      if (!tc.isHidden)
        results.push({
          input: tc.input.slice(0, 8192),
          expectedOutput: tc.expectedOutput.slice(0, 8192),
          actualOutput: result.stdout.slice(0, 8192),
          passed,
          executionTimeMs: result.executionTimeMs,
          stderr: result.stderr.slice(0, 4096),
        });
      if (!passed && verdict === Verdict.ACCEPTED)
        verdict = failure ?? Verdict.WRONG_ANSWER;
      if (failure) break;
    }
    return {
      verdict,
      passedCount,
      totalCount: testCases.length,
      results,
      totalExecutionTimeMs,
    };
  }
}
