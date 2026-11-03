import { describe, expect, it } from "vitest";
import { JudgeService } from "../src/services/judge.service";
import { ExecutionResult, Language, Verdict } from "../src/types";
import { compareOutput } from "../src/services/comparison";
import { parseArguments, problemContract } from "../src/services/contracts";
import {
  ExecutorFactory,
  PythonExecutor,
  JavascriptExecutor,
} from "../src/services/executorFactory";
import { canTransition, retryable } from "../src/queue/state";
import { executionConfig, assertSandboxPolicy } from "../src/config/execution";
import {
  submissionSchema,
  paginationSchema,
} from "../src/services/submission.service";
import { jobSchema } from "../src/queue/queue";
import { seedProblems } from "../src/data/seedProblems";
const contract = { functionName: "solve", comparison: "json" as const };
const success: ExecutionResult = {
  stdout: "1",
  stderr: "",
  exitCode: 0,
  timedOut: false,
  executionTimeMs: 10,
};
const judge = (result: Partial<ExecutionResult>) =>
  new JudgeService(() => ({
    execute: async () => ({ ...success, ...result }),
  })).judge(
    "source",
    Language.PYTHON,
    [{ input: "", expectedOutput: "1" }],
    contract,
  );
describe("judge failure precedence", () => {
  it("accepts successful matching output", async () =>
    expect((await judge({})).verdict).toBe(Verdict.ACCEPTED));
  it.each([
    [{ exitCode: 1 }, Verdict.RUNTIME_ERROR],
    [{ timedOut: true }, Verdict.TIME_LIMIT_EXCEEDED],
    [{ memoryLimitExceeded: true }, Verdict.MEMORY_LIMIT_EXCEEDED],
    [{ outputLimitExceeded: true }, Verdict.OUTPUT_LIMIT_EXCEEDED],
    [{ compilationError: true }, Verdict.COMPILE_ERROR],
    [{ stdout: "2" }, Verdict.WRONG_ANSWER],
  ])(
    "rejects matching output when execution fails: %j",
    async (result, verdict) => {
      const actual = await judge(result);
      expect(actual.verdict).toBe(verdict);
      expect(actual.passedCount).toBe(0);
    },
  );
  it("keeps a wall-clock kill as a timeout when the cgroup did not report OOM", async () =>
    expect(
      (
        await judge({
          timedOut: true,
          memoryLimitExceeded: false,
          exitCode: null,
        })
      ).verdict,
    ).toBe(Verdict.TIME_LIMIT_EXCEEDED));
  it("prefers a reported OOM over the wall-clock flag", async () =>
    expect(
      (await judge({ timedOut: true, memoryLimitExceeded: true })).verdict,
    ).toBe(Verdict.MEMORY_LIMIT_EXCEEDED));
  it("throws infrastructure failures for bounded retries", async () =>
    expect(judge({ infrastructureError: true })).rejects.toThrow());
  it("does not persist hidden stdout or expected outputs", async () => {
    const actual = await new JudgeService(() => ({
      execute: async () => success,
    })).judge(
      "",
      Language.PYTHON,
      [{ input: "private", expectedOutput: "1", isHidden: true }],
      contract,
    );
    expect(actual.results).toEqual([]);
    expect(actual.totalCount).toBe(1);
  });
  it("cannot accept empty suites", async () =>
    expect(
      new JudgeService().judge("", Language.PYTHON, [], contract),
    ).rejects.toThrow());
});
describe("comparison and invocation", () => {
  it("preserves spaces inside JSON strings", () =>
    expect(compareOutput('"a b"', '"ab"', contract)).toBe(false));
  it("compares nested JSON by value", () =>
    expect(
      compareOutput(
        '{"b":null,"a":[true,-2]}',
        '{"a":[true,-2],"b":null}',
        contract,
      ),
    ).toBe(true));
  it("preserves exact whitespace", () =>
    expect(
      compareOutput("x\n", "x", { ...contract, comparison: "exact" }),
    ).toBe(false));
  it("normalizes only explicitly", () =>
    expect(compareOutput("x\n", "x", { ...contract, comparison: "trim" })).toBe(
      true,
    ));
  it("requires explicit float tolerance", () => {
    expect(
      compareOutput("1.001", "1", {
        ...contract,
        comparison: "float",
        tolerance: 0.01,
      }),
    ).toBe(true);
    expect(
      compareOutput("", "0", {
        ...contract,
        comparison: "float",
        tolerance: 1,
      }),
    ).toBe(false);
  });
  it("supports structured args and multiline unicode", () =>
    expect(
      parseArguments('[[1,[-2]],"a\\nb 雪",true,null,{}]', {
        ...contract,
        inputMode: "json-args",
      }),
    ).toEqual([[1, [-2]], "a\nb 雪", true, null, {}]));
  it("supports legacy raw string inputs", () =>
    expect(parseArguments("III\n9", contract)).toEqual(["III", 9]));
  it("supports empty argument lists", () =>
    expect(parseArguments("", contract)).toEqual([]));
  it("derives contracts exclusively from trusted starter code", () => {
    for (const p of seedProblems)
      expect(problemContract(p).functionName).toMatch(/^[a-zA-Z_]/);
  });
  it("chooses exact language adapters", () => {
    expect(ExecutorFactory.getExecutor(Language.PYTHON)).toBeInstanceOf(
      PythonExecutor,
    );
    expect(ExecutorFactory.getExecutor(Language.JAVASCRIPT)).toBeInstanceOf(
      JavascriptExecutor,
    );
    expect(() => ExecutorFactory.getExecutor("sh" as Language)).toThrow();
  });
});
describe("state and boundaries", () => {
  it.each(["completed", "failed", "cancelled"] as const)(
    "terminal %s cannot return to running",
    (status) => expect(canTransition(status, "running")).toBe(false),
  );
  it("retries infrastructure only", () => {
    expect(retryable("infrastructure")).toBe(true);
    expect(retryable("wrong_answer")).toBe(false);
  });
  it("validates source bytes rather than characters", () => {
    expect(
      submissionSchema.safeParse({
        code: "雪".repeat(22000),
        problemId: "1",
        language: "python",
      }).success,
    ).toBe(false);
  });
  it("rejects blank and unsupported submissions", () => {
    for (const code of ["", "  ", 10])
      expect(
        submissionSchema.safeParse({ code, problemId: "1", language: "shell" })
          .success,
      ).toBe(false);
  });
  it("rejects unbounded pagination and malicious queue payloads", () => {
    expect(paginationSchema.safeParse({ limit: 1000 }).success).toBe(false);
    expect(
      jobSchema.safeParse({ submissionId: "x", code: "secret" }).success,
    ).toBe(false);
  });
  it("validates resource limits and fails closed", () => {
    const old = process.env.EXECUTION_MEMORY_MB;
    process.env.EXECUTION_MEMORY_MB = "-1";
    expect(() => executionConfig()).toThrow();
    if (old === undefined) delete process.env.EXECUTION_MEMORY_MB;
    else process.env.EXECUTION_MEMORY_MB = old;
    const runtime = process.env.SANDBOX_RUNTIME;
    process.env.SANDBOX_RUNTIME = "runc";
    expect(() => assertSandboxPolicy()).toThrow();
    if (runtime === undefined) delete process.env.SANDBOX_RUNTIME;
    else process.env.SANDBOX_RUNTIME = runtime;
  });
});
