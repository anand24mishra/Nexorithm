import { isDeepStrictEqual } from "node:util";
import { ExecutionContract } from "../types";
export function compareOutput(
  actual: string,
  expected: string,
  contract: ExecutionContract,
): boolean {
  switch (contract.comparison ?? "json") {
    case "exact":
      return actual === expected;
    case "trim":
      return actual.trim() === expected.trim();
    case "float": {
      const a = Number(actual),
        b = Number(expected),
        t = contract.tolerance;
      return (
        actual.trim() !== "" &&
        expected.trim() !== "" &&
        t !== undefined &&
        t >= 0 &&
        Number.isFinite(a) &&
        Number.isFinite(b) &&
        Math.abs(a - b) <= t
      );
    }
    case "json":
      try {
        return isDeepStrictEqual(JSON.parse(actual), JSON.parse(expected));
      } catch {
        return actual === expected;
      }
  }
}
