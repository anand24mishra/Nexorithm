import { ExecutionContract, NexorithmProblem } from "../types";
export function problemContract(problem: NexorithmProblem): ExecutionContract {
  if (problem.execution) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(problem.execution.functionName))
      throw new Error("Invalid function contract");
    return problem.execution;
  }
  // Compatibility uses only trusted starter metadata, never submitted source.
  const js = problem.starterCode.javascript.match(
    /(?:var|let|const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
  );
  const py = problem.starterCode.python.match(
    /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
  );
  if (!js || !py || js[1] !== py[1])
    throw new Error("Problem requires explicit execution metadata");
  return { functionName: js[1], inputMode: "legacy-lines", comparison: "json" };
}
export function parseArguments(
  input: string,
  contract: ExecutionContract,
): unknown[] {
  if (contract.inputMode === "json-args") {
    const value: unknown = JSON.parse(input);
    if (!Array.isArray(value))
      throw new Error("Input must be a JSON argument array");
    return value;
  }
  if (input === "") return [];
  return input.split("\n").map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return line;
    }
  });
}
