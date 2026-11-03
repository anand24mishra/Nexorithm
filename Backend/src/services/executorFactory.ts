import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { IExecutor } from "../interfaces/IExecutor";
import { ExecutionContract, ExecutionResult, Language } from "../types";
import { assertSandboxPolicy } from "../config/execution";
import { runtimeProgram } from "./runners";
import { EXPIRY_GRACE_MS, SandboxOwnership } from "./sandboxLifecycle";
import { logger, metrics } from "../telemetry";

export async function docker(
  args: string[],
  input = "",
  limit = 1048576,
  timeout = 15000,
): Promise<{
  stdout: string;
  stderr: string;
  code: number | null;
  overflow: boolean;
  timedOut: boolean;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = Buffer.alloc(0),
      stderr = Buffer.alloc(0),
      bytes = 0,
      overflow = false,
      timedOut = false;
    const collect = (kind: "stdout" | "stderr", chunk: Buffer) => {
      const available = Math.max(0, limit - bytes);
      bytes += chunk.length;
      if (kind === "stdout")
        stdout = Buffer.concat([stdout, chunk.subarray(0, available)]);
      else stderr = Buffer.concat([stderr, chunk.subarray(0, available)]);
      if (bytes > limit) {
        overflow = true;
        child.kill("SIGKILL");
      }
    };
    child.stdout.on("data", (b) => collect("stdout", b));
    child.stderr.on("data", (b) => collect("stderr", b));
    child.stdin.on("error", () => {
      /* EPIPE when runtime exits early */
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        code,
        overflow,
        timedOut,
      });
    });
    child.stdin.end(input);
  });
}

function ownershipLabels(ownership?: SandboxOwnership) {
  if (!ownership) return [];
  if (!/^[a-f0-9]{24}$/.test(ownership.submissionId)) return [];
  if (!Number.isInteger(ownership.attempt) || ownership.attempt < 1) return [];
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      ownership.leaseToken,
    )
  )
    return [];
  if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(ownership.workerId)) return [];
  return [
    "--label",
    `nexorithm.submission=${ownership.submissionId}`,
    "--label",
    `nexorithm.attempt=${ownership.attempt}`,
    "--label",
    `nexorithm.lease=${ownership.leaseToken}`,
    "--label",
    `nexorithm.worker=${ownership.workerId}`,
  ];
}

abstract class ContainerExecutor implements IExecutor {
  constructor(private readonly language: Language) {}
  async execute(
    code: string,
    input: string,
    timeoutMs?: number,
    contract?: ExecutionContract,
    ownership?: SandboxOwnership,
  ): Promise<ExecutionResult> {
    const c = assertSandboxPolicy();
    if (!contract) throw new Error("Explicit function contract required");
    const name = `nx-${randomUUID()}`;
    const timeout = timeoutMs ?? c.EXECUTION_TIMEOUT_MS;
    const started = performance.now();
    let created = false;
    try {
      const image =
        this.language === Language.PYTHON ? c.PYTHON_IMAGE : c.JAVASCRIPT_IMAGE;
      const command =
        this.language === Language.PYTHON
          ? ["python3", "-I", "-B", "-"]
          : ["node", `--max-old-space-size=${c.EXECUTION_MEMORY_MB * 4}`, "-"];
      const create = await docker([
        "create",
        "--pull=never",
        "--name",
        name,
        "--label",
        "nexorithm.sandbox=true",
        "--label",
        `nexorithm.created=${Date.now()}`,
        "--label",
        `nexorithm.expires=${Date.now() + timeout + EXPIRY_GRACE_MS}`,
        ...ownershipLabels(ownership),
        "--runtime",
        c.SANDBOX_RUNTIME,
        "--network=none",
        "--user=65534:65534",
        "--read-only",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,nodev,size=16777216,mode=1777",
        "--workdir=/tmp",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges:true",
        "--pids-limit",
        String(c.EXECUTION_PIDS),
        "--memory",
        `${c.EXECUTION_MEMORY_MB}m`,
        "--memory-swap",
        `${c.EXECUTION_MEMORY_MB}m`,
        "--cpus",
        String(c.EXECUTION_CPUS),
        "--ulimit",
        "fsize=16777216:16777216",
        "--ulimit",
        "nofile=64:64",
        "--log-driver=none",
        "-i",
        image,
        "timeout",
        "--signal=KILL",
        `${Math.ceil(timeout / 1000) + 2}s`,
        ...command,
      ]);
      if (create.code !== 0) throw new Error("Sandbox creation failed");
      created = true;
      metrics.sandboxStartup.observe((performance.now() - started) / 1000);
      const runStart = performance.now();
      const result = await docker(
        ["start", "-a", "-i", name],
        runtimeProgram(this.language, code, input, contract),
        c.EXECUTION_MAX_OUTPUT,
        timeout,
      );
      // Killing docker attach does not kill the container: force removal below is mandatory.
      if (result.timedOut || result.overflow) {
        const inspection = await docker([
          "inspect",
          "--format",
          "{{json .State}}",
          name,
        ]);
        const killed =
          inspection.code === 0 &&
          Boolean(
            (JSON.parse(inspection.stdout) as { OOMKilled?: boolean })
              .OOMKilled,
          );
        const removed = await docker(["rm", "-f", name]);
        if (removed.code !== 0) throw new Error("Sandbox termination failed");
        created = false;
        return {
          stdout: result.stdout,
          stderr: "",
          exitCode: null,
          timedOut: result.timedOut && !result.overflow && !killed,
          outputLimitExceeded: result.overflow,
          memoryLimitExceeded: killed,
          executionTimeMs: Math.round(performance.now() - runStart),
        };
      }
      const inspection = await docker([
        "inspect",
        "--format",
        "{{json .State}}",
        name,
      ]);
      if (inspection.code !== 0) throw new Error("Sandbox inspection failed");
      const state = JSON.parse(inspection.stdout) as {
        ExitCode: number;
        OOMKilled: boolean;
        Error: string;
      };
      const heapExhausted = /heap out of memory|Reached heap limit/i.test(
        result.stderr,
      );
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: state.ExitCode,
        timedOut: false,
        memoryLimitExceeded: state.OOMKilled || heapExhausted,
        compilationError: state.ExitCode === 42,
        infrastructureError: Boolean(state.Error),
        executionTimeMs: Math.round(performance.now() - runStart),
      };
    } finally {
      if (created) {
        const removed = await docker(["rm", "-f", name]);
        if (removed.code !== 0) {
          metrics.cleanupFailures.inc();
          logger.error({ operation: "sandbox_cleanup", sandbox: name });
          throw new Error("Sandbox cleanup failed");
        }
      }
    }
  }
}
export class PythonExecutor extends ContainerExecutor {
  constructor() {
    super(Language.PYTHON);
  }
}
export class JavascriptExecutor extends ContainerExecutor {
  constructor() {
    super(Language.JAVASCRIPT);
  }
}
export class ExecutorFactory {
  static getExecutor(language: Language): IExecutor {
    if (language === Language.PYTHON) return new PythonExecutor();
    if (language === Language.JAVASCRIPT) return new JavascriptExecutor();
    throw new Error("Unsupported language");
  }
  static getSupportedLanguages(): Language[] {
    return [Language.PYTHON, Language.JAVASCRIPT];
  }
}
