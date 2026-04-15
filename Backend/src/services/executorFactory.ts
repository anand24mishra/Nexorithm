import { execSync } from 'child_process';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { IExecutor } from '../interfaces/IExecutor';
import { ExecutionResult, Language } from '../types';
import { AppError } from '../errors/AppError';



abstract class BaseExecutor implements IExecutor {
  async execute(code: string, input: string, timeoutMs = 5000): Promise<ExecutionResult> { //Template
    const uniqueId = uuidv4();
    const ext = this.getFileExtension();
    const filePath = path.join('/tmp', `nexorithm-${uniqueId}.${ext}`);
    const startTime = performance.now();

    try {
      fs.writeFileSync(filePath, code, 'utf8');
      const command = this.getCommand(filePath);

      const stdout = execSync(command, { // adapter pattern
        input,
        timeout: timeoutMs,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const executionTimeMs = Math.round(performance.now() - startTime);

      return {
        stdout: stdout.trim(),
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs,
      };
    } catch (error: unknown) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      const execError = error as {
        killed?: boolean;
        signal?: string;
        status?: number;
        stderr?: string | Buffer;
        stdout?: string | Buffer;
        message?: string;
      };

      if (execError.killed || execError.signal === 'SIGTERM') {
        return {
          stdout: '',
          stderr: 'Time Limit Exceeded',
          exitCode: 1,
          timedOut: true,
          executionTimeMs,
        };
      }

      return {
        stdout: String(execError.stdout ?? '').trim(),
        stderr: String(execError.stderr ?? execError.message ?? 'Unknown error').trim(),
        exitCode: execError.status ?? 1,
        timedOut: false,
        executionTimeMs,
      };
    } finally {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        
      }
    }
  }

  protected abstract getCommand(filePath: string): string;
  protected abstract getFileExtension(): string;
}



export class JavascriptExecutor extends BaseExecutor {
  protected getCommand(filePath: string): string {
    return `node "${filePath}"`;
  }

  protected getFileExtension(): string {
    return 'js';
  }

  async execute(code: string, input: string, timeoutMs = 5000): Promise<ExecutionResult> {
    const runnerCode = `
${code}

const fs = require('fs');
function __main__() {
    const inputStr = fs.readFileSync(0, 'utf-8').trim();
    if (!inputStr) return;
    const lines = inputStr.split('\\n');
    let args = lines.map(line => {
        try { return JSON.parse(line); } catch(e) { return line; }
    });
    
    // Find the user's function
    let funcName = null;
    const varMatch = ${JSON.stringify(code)}.match(/var\\s+([a-zA-Z0-9_]+)\\s*=\\s*function/);
    const fnMatch = ${JSON.stringify(code)}.match(/function\\s+([a-zA-Z0-9_]+)/);
    
    if (varMatch && varMatch[1]) {
        funcName = varMatch[1];
    } else if (fnMatch && fnMatch[1]) {
        funcName = fnMatch[1];
    }
    
    if (funcName && typeof eval(funcName) === 'function') {
        const result = eval(funcName)(...args);
        if (result !== undefined) {
             console.log(JSON.stringify(result).replace(/\\s/g, ''));
        }
    } else {
        console.error("Could not find the solution function.");
    }
}
__main__();
`;
    return super.execute(runnerCode, input, timeoutMs);
  }
}

export class PythonExecutor extends BaseExecutor {
  protected getCommand(filePath: string): string {
    return `python3 "${filePath}"`;
  }

  protected getFileExtension(): string {
    return 'py';
  }

  async execute(code: string, input: string, timeoutMs = 5000): Promise<ExecutionResult> {
    const runnerCode = `
import sys
import json

${code}

if __name__ == '__main__':
    input_str = sys.stdin.read().strip()
    if not input_str:
        sys.exit(0)
    lines = input_str.split('\\n')
    args = []
    for line in lines:
        try:
            args.append(json.loads(line))
        except Exception:
            args.append(line)
            
    try:
        sol = Solution()
        methods = [m for m in dir(sol) if not m.startswith('__')]
        if not methods:
            print("No methods found in Solution class.", file=sys.stderr)
            sys.exit(1)
        
        # Get the defined function
        func = getattr(sol, methods[-1])
        result = func(*args)
        if result is not None:
            # Format python lists and dicts natively back as JSON output 
            output = json.dumps(result, separators=(',', ':'))
            # Boolean conversions for exact string match
            output = output.replace('true', 'true').replace('false', 'false')
            print(output)
    except NameError:
        print("Solution class not found.", file=sys.stderr)
        sys.exit(1)
`;
    return super.execute(runnerCode, input, timeoutMs);
  }
}



export class ExecutorFactory {
  private static readonly executors: Map<Language, IExecutor> = new Map<Language, IExecutor>([
    [Language.JAVASCRIPT, new JavascriptExecutor()],
    [Language.PYTHON, new PythonExecutor()],
  ]);

  static getExecutor(language: Language): IExecutor {
    const executor = this.executors.get(language);
    if (!executor) {
      throw new AppError(`Unsupported language: ${language}`, 400);
    }
    return executor;
  }

  static getSupportedLanguages(): Language[] {
    return Array.from(this.executors.keys());
  }
}