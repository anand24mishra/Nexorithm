import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];

function sh(args, timeout = 20000) {
  return execFileSync("docker", args, {
    cwd: root,
    encoding: "utf8",
    timeout,
  }).trim();
}
function compose(args, timeout = 60000, env = {}) {
  return execFileSync("docker", ["compose", ...args], {
    cwd: root,
    encoding: "utf8",
    timeout,
    env: { ...process.env, ...env },
  }).trim();
}
function record(name, ok, detail) {
  results.push({ name, ok, ...detail });
  const line = `${ok ? "PASS" : "FAIL"} ${name} ${JSON.stringify(detail)}\n`;
  appendFileSync("/tmp/nx-reliability-harness.log", line);
  process.stdout.write(line);
}
function baseUrl() {
  const port = compose(["port", "frontend", "8080"]);
  return `http://${port}`;
}
async function register(base) {
  const suffix = randomBytes(4).toString("hex");
  const password = randomBytes(18).toString("base64url");
  const response = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: `rel${suffix}`,
      email: `rel${suffix}@example.com`,
      password,
    }),
  });
  const text = await response.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`register ${response.status} ${text.slice(0, 80)}`);
  }
  if (!response.ok || !body.token) throw new Error(`register ${response.status}`);
  return body.token;
}
async function submit(base, token, code, language) {
  const response = await fetch(`${base}/api/submissions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, language, problemId: "1" }),
  });
  const text = await response.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`submit ${response.status} ${text.slice(0, 80)}`);
  }
  if (response.status !== 202) throw new Error(`submit ${response.status}`);
  return body.submissionId;
}
async function readSubmission(base, token, id) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(`${base}/api/submissions/${id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const text = await response.text();
    if (text.startsWith("<")) {
      await sleep(500);
      continue;
    }
    const body = JSON.parse(text);
    return {
      http: response.status,
      status: body.status,
      verdict: body.verdict ?? null,
      attempt: body.workerAttempt ?? null,
      queueWaitMs: body.queueWaitMs ?? null,
      executionTimeMs: body.executionTimeMs ?? null,
    };
  }
  throw new Error("submission read returned HTML");
}
async function until(deadline, label, predicate) {
  const started = Date.now();
  let last;
  while (Date.now() - started < deadline) {
    last = await predicate();
    if (last?.done) return { ...last, elapsedMs: Date.now() - started };
    await sleep(200);
  }
  throw new Error(`${label} deadline ${JSON.stringify(last)}`);
}
function health(path) {
  const started = Date.now();
  const out = sh(
    [
      "compose",
      "exec",
      "-T",
      "backend-api",
      "node",
      "-e",
      `fetch("http://127.0.0.1:8000${path}").then(async(r)=>{const t=await r.text(); console.log(JSON.stringify({status:r.status, body:t.slice(0,240)}));}).catch((e)=>console.log(JSON.stringify({status:0, body:e.name})));`,
    ],
    15000,
  );
  return { ...JSON.parse(out.split("\n").pop()), ms: Date.now() - started };
}
function serviceId(service) {
  return compose(["ps", "-aq", service]).split("\n")[0];
}
function isPaused(service) {
  return (
    sh(["inspect", "--format", "{{.State.Paused}}", serviceId(service)]) ===
    "true"
  );
}
function sandboxes() {
  const out = sh([
    "ps",
    "-aq",
    "--filter",
    "label=nexorithm.sandbox=true",
  ]);
  return out ? out.split("\n").filter(Boolean) : [];
}
function sandboxState(id) {
  try {
    return sh(["inspect", "--format", "{{.State.Status}}", id]);
  } catch {
    return "absent";
  }
}
function countSubmission(id) {
  const out = compose([
    "exec",
    "-T",
    "mongodb",
    "mongosh",
    "nexorithm",
    "--quiet",
    "--eval",
    `print(db.submissions.countDocuments({_id: ObjectId("${id}")}))`,
  ]);
  return Number(out.split("\n").pop());
}
async function waitDeps() {
  for (const service of ["redis", "mongodb"]) {
    const started = Date.now();
    while (Date.now() - started < 40000) {
      if (isPaused(service)) throw new Error(`${service} is still paused`);
      const status = sh([
        "inspect",
        "--format",
        "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
        serviceId(service),
      ]);
      if (status === "healthy") break;
      if (Date.now() - started >= 39000) throw new Error(`${service} stayed ${status}`);
      await sleep(1000);
    }
  }
}
async function waitHealthy(service) {
  const started = Date.now();
  while (Date.now() - started < 45000) {
    const status = sh([
      "inspect",
      "--format",
      "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
      serviceId(service),
    ]);
    if (status === "healthy") return Date.now() - started;
    await sleep(1000);
  }
  throw new Error(`${service} did not become healthy`);
}
async function outage(service, dependency) {
  compose(["pause", service]);
  try {
    if (!isPaused(service)) throw new Error(`${service} did not stay paused`);
    const [live, ready] = await Promise.all([
      Promise.resolve().then(() => health("/health/live")),
      Promise.resolve().then(() => health("/health/ready")),
    ]);
    const stillPaused = isPaused(service);
    const body = JSON.parse(ready.body);
    const ok =
      stillPaused &&
      live.status === 200 &&
      ready.status === 503 &&
      body.dependencies?.includes(dependency) &&
      ready.ms >= 1800;
    record(`${dependency} outage`, ok, {
      pausedAfterSample: stillPaused,
      live: live.status,
      liveMs: live.ms,
      ready: ready.status,
      readyMs: ready.ms,
      dependencies: body.dependencies,
    });
  } finally {
    compose(["unpause", service]);
  }
  const recovered = await until(20000, `${dependency} recovery`, async () => {
    const ready = health("/health/ready");
    return ready.status === 200 ? { done: true, ms: ready.ms } : {};
  });
  record(`${dependency} recovery`, true, { elapsedMs: recovered.elapsedMs });
}

const pythonAccepted = `class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i\n`;
const javascriptAccepted = `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n    seen.set(nums[i], i);\n  }\n}\n`;
const pythonLoop = `class Solution:\n    def twoSum(self, nums, target):\n        while True:\n            pass\n`;
const pythonMemory = `class Solution:\n    def twoSum(self, nums, target):\n        blob = []\n        while True:\n            blob.append(b"x" * 5000000)\n`;
const javascriptMemory = `function twoSum() {\n  const blob = [];\n  while (true) blob.push("x".repeat(1000000));\n}\n`;

async function main() {
  const base = baseUrl();
  if (process.env.RELIABILITY_PHASE !== "remainder") {
  const token = await register(base);
  await outage("redis", "redis");
  await outage("mongodb", "mongodb");
  compose(["pause", "redis"]);
  compose(["pause", "mongodb"]);
  try {
    if (!isPaused("redis") || !isPaused("mongodb"))
      throw new Error("combined pause failed");
    const [live, ready] = await Promise.all([
      Promise.resolve().then(() => health("/health/live")),
      Promise.resolve().then(() => health("/health/ready")),
    ]);
    const body = JSON.parse(ready.body);
    const still = isPaused("redis") && isPaused("mongodb");
    record("combined outage", still && live.status === 200 && ready.status === 503 && body.dependencies?.includes("mongodb") && body.dependencies?.includes("redis"), {
      pausedAfterSample: still,
      live: live.status,
      ready: ready.status,
      readyMs: ready.ms,
      dependencies: body.dependencies,
    });
  } finally {
    try { compose(["unpause", "redis"]); } catch { /* already resumed */ }
    try { compose(["unpause", "mongodb"]); } catch { /* already resumed */ }
  }
  await until(20000, "stack ready", async () =>
    health("/health/ready").status === 200 ? { done: true } : {},
  );

  compose(["stop", "-t", "5", "judge-worker"]);
  const queuedId = await submit(base, token, pythonAccepted, "python");
  await sleep(800);
  const whileStopped = await readSubmission(base, token, queuedId);
  await waitDeps();
  sh(["start", serviceId("judge-worker")]);
  await waitHealthy("judge-worker");
  const completed = await until(40000, "scenario A", async () => {
    const row = await readSubmission(base, token, queuedId);
    return row.status === "completed" ? { done: true, row } : {};
  });
  record("worker stopped before processing", whileStopped.status === "queued" && completed.row.verdict === "Accepted" && countSubmission(queuedId) === 1, {
    whileStopped: whileStopped.status,
    verdict: completed.row.verdict,
    elapsedMs: completed.elapsedMs,
    documents: countSubmission(queuedId),
  });

  const termToken = await register(base);
  const termId = await submit(base, termToken, pythonLoop, "python");
  await until(20000, "sigterm sandbox", async () => {
    const row = await readSubmission(base, termToken, termId);
    return row.status === "running" && sandboxes().length
      ? { done: true }
      : {};
  });
  const worker = serviceId("judge-worker");
  sh(["update", "--restart=no", worker]);
  try {
    sh(["kill", "--signal=TERM", worker]);
    const finished = await until(40000, "sigterm completion", async () => {
      const row = await readSubmission(base, termToken, termId);
      return row.status === "completed" || row.status === "failed"
        ? { done: true, row, sandboxes: sandboxes().length }
        : {};
    });
    record("graceful SIGTERM", finished.row.verdict === "Time Limit Exceeded" && finished.sandboxes === 0 && countSubmission(termId) === 1, {
      verdict: finished.row.verdict,
      elapsedMs: finished.elapsedMs,
      sandboxes: finished.sandboxes,
    });
  } finally {
    sh(["update", "--restart=unless-stopped", worker]);
    sh(["start", worker]);
    await waitHealthy("judge-worker");
  }

  const killToken = await register(base);
  const killId = await submit(base, killToken, pythonLoop, "python");
  const seen = await until(20000, "sigkill sandbox", async () => {
    const ids = sandboxes();
    const row = await readSubmission(base, killToken, killId);
    return row.status === "running" && ids.length
      ? { done: true, id: ids[0] }
      : {};
  });
  const killedWorker = serviceId("judge-worker");
  sh(["update", "--restart=no", killedWorker]);
  const killedAt = Date.now();
  sh(["kill", "--signal=KILL", killedWorker]);
  let stoppedAt = null;
  let goneAt = null;
  await until(30000, "sandbox removal", async () => {
    const state = sandboxState(seen.id);
    if (state !== "running" && state !== "created" && stoppedAt === null)
      stoppedAt = Date.now();
    if (state === "absent") {
      goneAt = Date.now();
      return { done: true };
    }
    return {};
  });
  const reaperUp =
    sh([
      "inspect",
      "--format",
      "{{.State.Status}}",
      serviceId("sandbox-reaper"),
    ]) === "running";
  sh(["update", "--restart=unless-stopped", killedWorker]);
  sh(["start", killedWorker]);
  await waitHealthy("judge-worker");
  const recovered = await until(130000, "sigkill recovery", async () => {
    const row = await readSubmission(base, killToken, killId);
    return row.status === "completed" || row.status === "failed"
      ? { done: true, row }
      : {};
  });
  record("SIGKILL during execution", reaperUp && goneAt !== null && recovered.row.verdict === "Time Limit Exceeded" && countSubmission(killId) === 1 && sandboxes().length === 0, {
    reaperUp,
    runningToExitMs: stoppedAt ? stoppedAt - killedAt : null,
    removedMs: goneAt - killedAt,
    recoveryMs: recovered.elapsedMs,
    verdict: recovered.row.verdict,
    attempt: recovered.row.attempt,
    documents: countSubmission(killId),
  });

  compose(["stop", "-t", "10", "judge-worker"]);
  for (const id of sh([
    "ps",
    "-q",
    "--filter",
    "label=com.docker.compose.service=judge-worker",
  ])
    .split("\n")
    .filter(Boolean))
    sh(["stop", "-t", "5", id]);
  try {
    sh(["rm", "-f", "nx-fault-worker"]);
  } catch {
    /* no previous fault worker */
  }
  compose([
    "run",
    "-d",
    "--name",
    "nx-fault-worker",
    "--no-deps",
    "-e",
    "FAULT_AFTER_EXECUTION=crash",
    "-e",
    "LEASE_MS=8000",
    "judge-worker",
  ]);
  try {
    await until(20000, "fault worker", async () =>
      sh(["inspect", "--format", "{{.State.Status}}", "nx-fault-worker"]) ===
      "running"
        ? { done: true }
        : {},
    );
    const faultEnv = sh(["exec", "nx-fault-worker", "printenv", "FAULT_AFTER_EXECUTION"]);
    const runningWorkers = sh([
      "ps",
      "--format",
      "{{.Names}}",
      "--filter",
      "label=com.docker.compose.service=judge-worker",
    ])
      .split("\n")
      .filter(Boolean);
    if (faultEnv !== "crash" || runningWorkers.length !== 1)
      throw new Error(`fault worker setup ${faultEnv} ${runningWorkers.join(",")}`);
    const faultToken = await register(base);
    const faultId = await submit(base, faultToken, pythonAccepted, "python");
    await until(30000, "fault exit", async () =>
      sh(["inspect", "--format", "{{.State.Status}}", "nx-fault-worker"]) ===
      "exited"
        ? { done: true }
        : {},
    );
    const stuck = await readSubmission(base, faultToken, faultId);
    try {
      sh(["rm", "-f", "nx-fault-worker"]);
    } catch {
      /* already removed */
    }
    await waitDeps();
    compose(["up", "-d", "--no-deps", "judge-worker"], 120000);
    await waitHealthy("judge-worker");
    const resolved = await until(90000, "fault recovery", async () => {
      const row = await readSubmission(base, faultToken, faultId);
      return row.status === "completed" || row.status === "failed"
        ? { done: true, row }
        : {};
    });
    record("crash after execution before save", stuck.status === "running" && resolved.row.verdict === "Accepted" && countSubmission(faultId) === 1 && resolved.row.attempt >= 2, {
      beforeRecovery: stuck.status,
      verdict: resolved.row.verdict,
      attempt: resolved.row.attempt,
      elapsedMs: resolved.elapsedMs,
      documents: countSubmission(faultId),
    });
  } finally {
    try {
      sh(["rm", "-f", "nx-fault-worker"]);
    } catch {
      /* already removed */
    }
    try {
      compose(["up", "-d", "--no-deps", "judge-worker"], 120000);
    } catch {
      /* the next scenario starts it */
    }
  }

  compose([
    "exec",
    "-T",
    "-e",
    `SUBMISSION_ID=${queuedId}`,
    "backend-api",
    "node",
    "-e",
    `const {Queue}=require("bullmq"); const u=new URL(process.env.REDIS_URL); const q=new Queue("nexorithm-judge",{connection:{host:u.hostname,port:Number(u.port||6379),db:Number(u.pathname.slice(1)||0),maxRetriesPerRequest:1}}); (async()=>{ const id=process.env.SUBMISSION_ID; const existing=await q.getJob(id); if(existing) await existing.remove(); await q.add("judge",{submissionId:id},{jobId:id}); await q.close(); })().catch((e)=>{console.error(e.message); process.exit(1);});`,
  ]);
  await sleep(5000);
  const duplicated = await readSubmission(base, token, queuedId);
  record("duplicate delivery", duplicated.status === "completed" && duplicated.verdict === "Accepted" && countSubmission(queuedId) === 1, {
    status: duplicated.status,
    verdict: duplicated.verdict,
    attempt: duplicated.attempt,
    documents: countSubmission(queuedId),
  });
  }

  compose(["pause", "redis"]);
  let missingId;
  try {
    const missingToken = await register(base);
    missingId = await submit(base, missingToken, pythonAccepted, "python");
    await sleep(500);
    const during = await readSubmission(base, missingToken, missingId);
    if (!isPaused("redis")) throw new Error("redis resumed before the sample");
    record("queued without redis", during.status === "queued" && isPaused("redis"), {
      status: during.status,
      paused: isPaused("redis"),
    });
    compose(["unpause", "redis"]);
    const repaired = await until(30000, "reconcile", async () => {
      const row = await readSubmission(base, missingToken, missingId);
      return row.status === "completed" ? { done: true, row } : {};
    });
    record("reconcile missing job", repaired.row.verdict === "Accepted" && countSubmission(missingId) === 1, {
      verdict: repaired.row.verdict,
      elapsedMs: repaired.elapsedMs,
    });
    missingId = null;
  } finally {
    if (isPaused("redis")) compose(["unpause", "redis"]);
  }

  const memoryToken = await register(base);
  const pyMem = await submit(base, memoryToken, pythonMemory, "python");
  const pyDone = await until(20000, "python memory", async () => {
    const row = await readSubmission(base, memoryToken, pyMem);
    return row.verdict ? { done: true, row } : {};
  });
  const jsMem = await submit(base, memoryToken, javascriptMemory, "javascript");
  const jsDone = await until(20000, "javascript memory", async () => {
    const row = await readSubmission(base, memoryToken, jsMem);
    return row.verdict ? { done: true, row } : {};
  });
  record("memory classification", pyDone.row.verdict === "Memory Limit Exceeded", {
    python: pyDone.row.verdict,
    pythonMs: pyDone.row.executionTimeMs,
    javascript: jsDone.row.verdict,
    javascriptMs: jsDone.row.executionTimeMs,
  });

  const batches = [
    [1, "python", pythonAccepted],
    [1, "javascript", javascriptAccepted],
    [2, "python", pythonAccepted],
    [3, "python", pythonAccepted],
  ];
  for (const [concurrency, language, code] of batches) {
    await waitDeps();
    compose(
      ["up", "-d", "--no-deps", "--force-recreate", "judge-worker"],
      120000,
      { WORKER_CONCURRENCY: String(concurrency) },
    );
    await waitHealthy("judge-worker");
    const actual = compose([
      "exec",
      "-T",
      "judge-worker",
      "printenv",
      "WORKER_CONCURRENCY",
    ]);
    const batchToken = await register(base);
    const started = Date.now();
    const ids = [];
    for (let i = 0; i < 4; i++)
      ids.push(await submit(base, batchToken, code, language));
    const rows = [];
    for (const id of ids) {
      const done = await until(90000, "throughput", async () => {
        const row = await readSubmission(base, batchToken, id);
        return row.status === "completed" ? { done: true, row } : {};
      });
      rows.push(done.row);
    }
    const wall = Date.now() - started;
    record(`concurrency ${concurrency} ${language}`, actual === String(concurrency) && rows.every((row) => row.verdict === "Accepted"), {
      configuredConcurrency: actual,
      jobs: ids.length,
      wallMs: wall,
      judgmentsPerSecond: Number((ids.length / (wall / 1000)).toFixed(3)),
      queueWaitMs: rows.map((row) => row.queueWaitMs),
      executionTimeMs: rows.map((row) => row.executionTimeMs),
      note: "four Two Sum judgments; not a saturation capacity",
    });
  }
}

main()
  .catch((error) => {
    record("harness", false, { error: error.message });
    process.exitCode = 1;
  })
  .finally(() => {
    try { if (isPaused("redis")) compose(["unpause", "redis"]); } catch { /* restored */ }
    try { if (isPaused("mongodb")) compose(["unpause", "mongodb"]); } catch { /* restored */ }
    try {
      const worker = serviceId("judge-worker");
      sh(["update", "--restart=unless-stopped", worker]);
      sh(["start", worker]);
    } catch { /* worker already running */ }
    try {
      compose(
        ["up", "-d", "--no-deps", "--force-recreate", "judge-worker"],
        120000,
        { WORKER_CONCURRENCY: "1" },
      );
    } catch {
      /* restored by the next healthy start */
    }
    console.log(`SUMMARY ${JSON.stringify({ passed: results.filter((row) => row.ok).length, failed: results.filter((row) => !row.ok).length })}`);
  });
