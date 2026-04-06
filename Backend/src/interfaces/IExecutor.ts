import { ExecutionResult } from '../types';

export interface IExecutor {
  execute(code: string, input: string, timeoutMs?: number): Promise<ExecutionResult>;
}
