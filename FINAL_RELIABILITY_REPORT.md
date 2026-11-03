# Nexorithm reliability report

Date: 2026-10-28. Host: Darwin 25.6.0 arm64, Apple M3, 8 GB RAM, Docker Desktop 29.1.3, about 4.1 GB for the VM. Git HEAD `fcb2542` with the reliability fixes uncommitted. No push.

## A. Initial problems

The 2026-10-28 verification had already judged real Python and JavaScript. These gaps were still open:

- A worker `SIGKILL` left its sandbox running. The worker's `finally` block cannot run after that signal.
- The first recovery script checked state on a timer, so it reported failure when recovery had not finished, and it sometimes observed Redis after it had already been unpaused.
- MongoDB readiness was not sampled for a whole outage.
- Nothing crashed the worker in the gap after execution and before the terminal MongoDB write.
- The working tree was dirty. `origin` is `rajatrsrivastav/Nexorithm`, ahead 1 and behind 2. The portfolio repository `anand24mishra/Nexorithm` has a different `main` tip, `7552d49`.
- gVisor is not installed. GitHub Actions were not run.
- Process counters reset on restart, and the dashboard could be read as a lifetime total.

## B. Root causes

The sandbox is a child of the Docker daemon, not of the worker's `finally` block. The in-container `timeout` still kills the process. Nobody removed the exited container until a worker started and its expiry label had passed.

Readiness treated MongoDB as up whenever the driver still said `readyState === 1`. A pause does not clear that flag immediately, and a ping was not attempted. Redis commands on an existing connection had no command timeout, so `queue.add` waited until nginx returned an HTML error page.

`process.kill(1, "SIGKILL")` inside the worker container returned success and left PID 1 alive. The crash checkpoint has to exit the process another way.

The git histories diverged before this work. Local `fcb2542` and portfolio `7552d49` share a commit message and not a hash.

## C. Engineering fixes

- `sandbox-reaper` is a separate Compose service. It removes only `nexorithm.sandbox=true` containers, and only under the rules in `docs/sandbox-lifecycle.md`.
- Containers carry submission, attempt, lease, worker, created, and expiry labels.
- Readiness pings MongoDB and Redis in parallel with a 2 second budget and names the failed dependency.
- The queue client fails a command after 2 seconds. The worker's blocking connection does not use that timeout.
- `FAULT_AFTER_EXECUTION=crash` exits 137 after a successful judge and before `complete`. It is ignored in production.
- The submission count on the dashboard is `nx_submissions_persisted`, a MongoDB gauge. Rates stay rates. Prometheus also scrapes the reaper.
- nginx resolves `backend-api` per request, so recreating the API does not stick the proxy to a dead address.
- `scripts/reliability-harness.mjs` polls until a deadline and unpauses dependencies in `finally`.

## D. Test results

| Suite | Result |
| --- | --- |
| Backend unit | 45 passed |
| Backend integration, Compose network, stubbed executor | 14 passed |
| Sandbox security, Docker `runc` | 19 passed |
| Frontend unit | 18 passed |
| Frontend ESLint | 0 warnings |
| Playwright | 4 passed |
| Backend ESLint | 0 warnings |
| Live harness rows below | passed |

Security and the live harness used `runc`. They are not a `runsc` result.

## E. Worker recovery

| Case | Observed |
| --- | --- |
| Stopped before processing | Stayed queued, then one Accepted document |
| `SIGTERM` during an infinite loop | Time Limit Exceeded in 5,015 ms, no sandbox left |
| `SIGKILL` during an infinite loop | Sandbox running ended at 7,007 ms, container gone at 12,151 ms, one Time Limit Exceeded document, attempt 2, recovery poll 79,999 ms |
| Exit after execution, before save | Still `running` after exit 137, then one Accepted document, attempt 2, recovery poll 80,139 ms |
| Duplicate job id after completion | Stayed Accepted, attempt 1, one document |
| Redis paused during submit | Row stayed queued while Redis was paused, then Accepted 2,539 ms after unpause |

## F. Sandbox cleanup

The reaper is independent of the worker process. It will not remove an in-budget container, and it will not remove a past-deadline container whose lease token still matches. Exited containers wait 5 seconds so the worker can read the exit state.

Measured removal after `SIGKILL`: 12.2 seconds, and 12.1 seconds on the repeat. The filter was empty afterward. This is not instantaneous.

## G. Database reliability

While the named container was still paused:

- Redis: live 200 in 349 ms, ready 503 in 2,242 ms, dependency `redis`
- MongoDB: live 200 in 191 ms, ready 503 in 2,233 ms, dependency `mongodb`
- Both: live 200, ready 503 in 2,196 ms, dependencies `mongodb` and `redis`

Ready returned 235 ms after Redis unpaused and 225 ms after MongoDB unpaused.

## H. Git repository

`origin` pushes to `https://github.com/rajatrsrivastav/Nexorithm.git`. That `main` is `b7b3fc8`. Local `main` is `fcb2542`, ahead 1 and behind 2. The portfolio `main` is `7552d49` and does not contain `fcb2542`.

Local backups, not pushed: branch `backup/main-fcb2542-2026-10-28`, `refs/backup/worktree-2026-10-28` from before these edits, and `refs/backup/worktree-reliability-2026-10-28` (`7ed5441`) after them. Ignored secret files were not included.

Do not force-push and do not push local `main` to either GitHub repository. The safe publication is a new branch, an authorized commit that excludes `.env` and `monitoring/metrics-token`, and a non-forced push of that branch. The commands are in `docs/git-reconciliation-report.md`. They were not run.

## I. Production security

`docker info` lists `runc` and `io.containerd.runc.v2`. It does not list `runsc`. Production Compose still selects `runsc` and fails closed. Public untrusted-code execution stays disabled. No cloud host was created. GitHub Actions were reviewed on disk and not executed. Workflow actions are pinned to major tags such as `@v4`, not to commit SHAs. The sandbox workflow is `workflow_dispatch` on a self-hosted Linux runner.

## J. Performance

Four Two Sum jobs, not a saturation test:

- Concurrency 1, Python: 8,037 ms wall, 0.498 judgments/s
- Concurrency 1, JavaScript: 5,854 ms wall, 0.683 judgments/s
- Concurrency 2, Python: 19,465 ms wall, 0.205 judgments/s
- Concurrency 3, Python: 11,717 ms wall, 0.341 judgments/s

Concurrency 2 and 3 made each Python sandbox slower on this VM. The worker was put back at concurrency 1. Earlier k6 read numbers are unchanged and are not judgment throughput.

On this run a Python memory bomb was Memory Limit Exceeded in 1,421 ms and a JavaScript memory bomb was Memory Limit Exceeded in 2,981 ms. An earlier run classified the JavaScript bomb as Time Limit Exceeded because the 5 second wall clock won. The code still prefers a reported memory kill over the wall clock, and it does not invent a memory verdict for a timeout.

## K. Remaining risks

- No gVisor, no Linux runner, no cloud CI, no paging, no Google OAuth.
- Sandbox removal after `SIGKILL` takes about 12 seconds, not zero.
- Submission reclaim waits for the 90 second lease.
- PID 1 ignores an in-container `SIGKILL` from itself on this daemon. The test fault uses `process.exit(137)` instead.
- Process counters still reset. The stored-submission panel is the durable number. At the last scrape it was 73.
- The git tree is dirty and the two GitHub histories do not fast-forward.
- Concurrency above 1 was slower here. That may not hold on a larger Linux host, and it was not remeasured on one.

## L. Resume-ready achievements

- Added a separate sandbox reaper that removes only Nexorithm containers, and measured a worker `SIGKILL` ending the sandbox at 7.0 seconds and deleting it at 12.2 seconds, with one recovered Time Limit Exceeded document.
- Made readiness fail in about 2.2 seconds while Redis or MongoDB was still paused, including both at once, and return to ready after unpause. A paused Redis now returns HTTP 202 for a durable queued submission instead of hanging until the proxy times out.
- Measured one worker at 0.50 Python and 0.68 JavaScript Two Sum judgments per second on four-job samples, and showed that concurrency 2 and 3 reduced throughput on this 4 GB Docker VM.

## M. Interview preparation

1. The API must answer before the program finishes. The queue holds the work so a slow or crashed judge does not hold the HTTP connection, and the MongoDB row is still there if Redis loses the job.
2. A killed worker loses its `finally` block. The container's own timeout kills the program. The reaper deletes the labeled container. The lease expires, the row goes back to queued, and another worker runs it once.
3. Lease fencing means a late worker can update the row only while it still holds the current token. A stale worker's completion matches nothing.
4. The reconciler finds queued rows with no live Redis job and enqueues them. It also returns rows whose lease has expired. Attempts stop at 3.
5. The process that created the container may already be dead. Cleanup has to be something else: the timeout inside the container, and a reaper that only matches Nexorithm labels and respects a live lease.
6. Liveness means the process can answer. Readiness means MongoDB and Redis answered inside the budget. A paused database stays live and becomes not ready.
7. `runc` is the ordinary container runtime and shares the host kernel. gVisor `runsc` adds another kernel boundary. This machine only has `runc`. Production refuses to start without `runsc`. Those are not the same guarantee.
8. The read benchmark's 89 requests/s is HTTP. The worker's 0.50 judgments/s is finished Python programs. Concurrency 2 lowered that rate on this VM because each sandbox got slower. Quote the measurement and the sample size, not a capacity slogan.
