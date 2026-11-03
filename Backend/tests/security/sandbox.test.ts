import { beforeAll, describe, expect, it } from "vitest";
import { ExecutorFactory, docker } from "../../src/services/executorFactory";
import { Language } from "../../src/types";
const contract = { functionName: "solve", inputMode: "json-args" as const };
beforeAll(() => {
  if (process.env.RUN_SANDBOX_SECURITY !== "1")
    throw new Error(
      "Security tests require RUN_SANDBOX_SECURITY=1 on an isolated Linux runner",
    );
});
for (const language of [Language.PYTHON, Language.JAVASCRIPT])
  describe(language, () => {
    const executor = ExecutorFactory.getExecutor(language);
    const source = (py: string, js: string) =>
      language === Language.PYTHON
        ? `class Solution:\n    def solve(self):\n${py}`
        : `function solve() { ${js} }`;
    it("returns structured unicode data", async () => {
      const result = await executor.execute(
        source(
          '        return {"x": [True, None, "雪 a b"]}',
          'return {x:[true,null,"雪 a b"]}',
        ),
        "[]",
        5000,
        contract,
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ x: [true, null, "雪 a b"] });
    });
    it("kills infinite loops and cleans the container", async () => {
      const result = await executor.execute(
        source("        while True: pass", "while(true){}"),
        "[]",
        1000,
        contract,
      );
      expect(result.timedOut).toBe(true);
    });
    it("enforces output bounds", async () => {
      const result = await executor.execute(
        source(
          '        while True: print("x" * 65536)',
          'while(true) process.stdout.write("x".repeat(65536))',
        ),
        "[]",
        5000,
        contract,
      );
      expect(result.outputLimitExceeded).toBe(true);
      expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(1048576);
    });
    it("enforces the memory boundary", async () => {
      const result = await executor.execute(
        source(
          "        data=[]\n        while True: data.append(bytearray(16 * 1024 * 1024))",
          "const data=[]; while(true) data.push(Buffer.alloc(16 * 1024 * 1024))",
        ),
        "[]",
        10000,
        contract,
      );
      expect(result.memoryLimitExceeded || result.exitCode !== 0).toBe(true);
    });
    it("enforces the process boundary", async () => {
      const result = await executor.execute(
        source(
          '        import subprocess\n        children=[]\n        try:\n            while True: children.append(subprocess.Popen(["sleep", "10"]))\n        except OSError:\n            return True',
          'const cp=require("child_process"); const children=[]; while(true) children.push(cp.spawn("sleep",["10"]))',
        ),
        "[]",
        10000,
        contract,
      );
      expect(
        result.stdout === "true" || result.timedOut || result.exitCode !== 0,
      ).toBe(true);
    });
    it("reports runtime errors", async () => {
      const result = await executor.execute(
        source(
          '        raise Exception("failure")',
          'throw new Error("failure")',
        ),
        "[]",
        5000,
        contract,
      );
      expect(result.exitCode).not.toBe(0);
    });
    it("reports syntax errors", async () => {
      const result = await executor.execute(
        "invalid syntax !!!",
        "[]",
        5000,
        contract,
      );
      expect(result.compilationError).toBe(true);
    });
    it("denies host data and root writes", async () => {
      const code = source(
        '        import os\n        assert not os.path.exists("/var/run/docker.sock")\n        assert "JWT_SECRET" not in os.environ\n        assert os.getuid() != 0\n        try:\n            open("/nx-forbidden", "w")\n            return False\n        except OSError:\n            return True',
        'const fs=require("fs"); if(fs.existsSync("/var/run/docker.sock") || process.env.JWT_SECRET || process.getuid()===0) return false; try{fs.writeFileSync("/nx-forbidden","x");return false}catch{return true}',
      );
      const result = await executor.execute(code, "[]", 5000, contract);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("true");
    });
    it("blocks outbound network", async () => {
      const code = source(
        '        import socket\n        try:\n            socket.create_connection(("1.1.1.1", 53), 1)\n            return False\n        except OSError:\n            return True',
        'return new Promise(resolve=>{const s=require("net").connect(53,"1.1.1.1");s.on("error",()=>resolve(true));s.setTimeout(1000,()=>{s.destroy();resolve(true)});s.on("connect",()=>{s.destroy();resolve(false)})})',
      );
      const result = await executor.execute(code, "[]", 5000, contract);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("true");
    });
  });
it("leaves no sandbox containers after execution", async () => {
  const listed = await docker([
    "ps",
    "-aq",
    "--filter",
    "label=nexorithm.sandbox=true",
  ]);
  expect(listed.code).toBe(0);
  expect(listed.stdout.trim()).toBe("");
});
