import { ExecutionResult, ExecutionContract } from "../types";
import { SandboxOwnership } from "../services/sandboxLifecycle";

export interface IExecutor {
  execute(
    code: string,
    input: string,
    timeoutMs?: number,
    contract?: ExecutionContract,
    ownership?: SandboxOwnership,
  ): Promise<ExecutionResult>;
}
