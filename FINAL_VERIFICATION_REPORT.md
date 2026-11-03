# Nexorithm final verification report

Date: 2026-10-28. Scope: the local working tree on this Mac. No commit, push, public deploy, or cloud spend.

## 1. Executive summary

The local Docker Compose stack starts and judges real Python and JavaScript programs. HTTP 202 submission, MongoDB persistence, BullMQ processing, owner checks, hidden-test filtering, resource limits and container cleanup were exercised on Docker Desktop's `runc` runtime. The frontend entry bundle no longer includes Monaco. Prometheus, Grafana and the worker-down alert rule were observed with live data.

Nexorithm is a verified local development stack. It is not ready for public untrusted code. gVisor `runsc` is not installed, the production Compose file was only rendered, and GitHub Actions were not executed in the cloud. Public execution stays disabled.

## 2. Environment

| Item | Value |
| --- | --- |
| OS | Darwin 25.6.0, arm64, Apple M3, 8 GB RAM |
| Node / npm | v24.15.0 / 11.12.1 |
| Docker | Desktop 29.1.3 client and engine, Compose v2.40.3, linux/arm64 VM with about 4.1 GB |
| Runtime | Default `runc` 1.3.4. Also `io.containerd.runc.v2`. No `runsc` |
| k6 | 2.0.0 at `/opt/homebrew/bin/k6` |
| Git | `main` at `fcb2542`, 2026-09-20, message `ci: deploy frontend to S3 and CloudFront` |
| Remote | `origin` `https://github.com/rajatrsrivastav/Nexorithm.git`, ahead 1, behind 2 |
| Tree | Dirty. The engineering upgrade is uncommitted. Nothing was committed or pushed |
| Published ports | Frontend `127.0.0.1:8088`, Grafana `127.0.0.1:3001`. API, MongoDB, Redis and Prometheus are internal |
| Worker | Concurrency 1, `SANDBOX_RUNTIME=runc`, `ALLOW_WEAK_SANDBOX=true`, `DOCKER_GID=0` |

Ports 8080 and 3000 were already occupied by unrelated software and were not stopped. An older container from this Compose project, `nexorithm-backend-1`, had no volume and was removed as an orphan when the stack started.

## 3. Functional verification

The path that ran was browser or HTTP client, nginx, Express, MongoDB, Redis/BullMQ, judge worker, then a new Python or Node container.

Python and JavaScript Two Sum solutions both returned Accepted after passing through queued or running into completed. The same pipeline returned Wrong Answer, Runtime Error, Compile Error, Time Limit Exceeded and Output Limit Exceeded for both languages. Python memory exhaustion returned Memory Limit Exceeded in about 1.8 seconds. JavaScript memory exhaustion hits the cgroup at about 8.5 seconds, so the default 5 second budget classifies it as Time Limit Exceeded. Raising that budget to 15 seconds returned Memory Limit Exceeded in 8,546 ms, and the worker was then returned to 5,000 ms.

A JSON-argument problem with empty input, nested arrays, a Unicode object and one hidden case returned Accepted for both languages. The hidden input string was absent from the problem payload and the submission payload. A second account received 404 for the first account's submission. Blank code returned 400. An unknown problem returned 404.

In the browser, a new account reached the dashboard. Opening Two Sum loaded Monaco from `editor.api2-C1WF0-a4.js`. Submitting the starter code rendered Wrong Answer. The history page showed one JavaScript submission, 2,818 ms, and a 0% success rate. Google sign-in is shown as not configured.

Tested locally. Not tested on Linux, under gVisor, in CI, in staging, or in production.

## 4. Security verification

Sandbox flags are enforced by `docker create`, and the behavioral suite passed 19 tests under `runc`: non-root user, read-only root, no Docker socket, no JWT in the environment, no network to `1.1.1.1:53`, process limit, output bound, timeout cleanup, and no leftover containers. Direct runs showed `OOMKilled` and exit 137 for both languages. Details and the weak memory assertion are in `docs/sandbox-verification-report.md`.

Production fail-closed behavior was observed. A production-mode worker set to `runc` exited. A worker set to `runsc` exited because that runtime is missing. Neither downgraded.

API checks: anonymous, expired, bad-signature and unsigned JWTs returned 401. CORS allowed `http://localhost:8088` and denied `http://evil.example`. API responses carry one `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and an `x-request-id`. The submission rate limit returns 429 JSON. A marker written into submitted source did not appear in logs.

Residual risk: this is Docker Desktop `runc`, the worker can see the root-owned engine socket, and gVisor was not tested. Public hostile code is not safe here.

## 5. Reliability verification

- Worker stopped: a submission stayed queued at HTTP 202, then completed Accepted after the worker started.
- Worker `SIGKILL` during an infinite loop: the sandbox was still up at 3 seconds, then removed. Verdict was Time Limit Exceeded.
- Redis paused: `/health/live` stayed 200. `/health/ready` returned `{"status":"unavailable"}` within 2 seconds. Unpausing restored 200.
- Three parallel Python jobs with concurrency 1 all completed Accepted. Queue waits were 19 ms, 3,812 ms and 5,703 ms.
- Fourteen integration tests passed against Mongo `nexorithm_test` and Redis database 15, including duplicate delivery, stale lease completion and a queued record with no Redis job. Those tests stub the executor. Attempts are capped at 3. The lease is 90 seconds. Reconciliation runs every 10 seconds.

A clean Mongo-pause measurement was not repeated after an earlier script left Mongo paused and the stack was recovered. A crash injected exactly between a finished container and the database write was not run as its own case.

## 6. Automated tests

| Suite | Result | What it proves |
| --- | --- | --- |
| Backend unit | 33 passed | Policy and judge logic |
| Backend integration | 14 passed | Mongo and Redis, stubbed execution |
| Sandbox security | 19 passed | `runc` containers on this Mac |
| Frontend unit | 18 passed | Components and hooks |
| Playwright | 4 passed | UI flow against a stubbed API |
| Backend typecheck, ESLint, Prettier | Passed | Static checks |
| Frontend ESLint | Passed, 0 warnings | Includes the six earlier hook warnings, which were fixed |
| `npm audit` high, backend and frontend | 0 vulnerabilities | This date only |

The six hook warnings were real dependency mismatches in the workspace, login and signup effects. The workspace effects were merged so changing the draft does not reset the editor, and the Google callback is stable so the button effect does not loop.

## 7. Performance benchmarks

Methodology and tables are in `docs/performance-benchmarks.md`.

Read-only k6 against `http://127.0.0.1:8088`, one second sleep per iteration, 2026-10-28:

- 10 VU: 7.43 rps, 0% failed, p50 9.86 ms, p95 2.44 s
- 50 VU: 45.69 rps, 0% failed, p50 4.84 ms, p95 42.03 ms, p99 191.22 ms
- 100 VU: 89.15 rps, 0% failed, p50 4.03 ms, p95 471.38 ms, p99 678.41 ms

250 and 500 virtual users were not run. These figures are not saturated HTTP capacity, because the script sleeps.

Completed judgments, measured with three Python Two Sum jobs and one worker: 7,844 ms wall time, 0 failures, about 0.38 judgments per second. HTTP requests per second and judgments per second are different numbers.

## 8. Observability

Prometheus scraped the API and the worker. Both targets were up. Grafana 11.6.0 reported database ok, and the Prometheus datasource returned "Successfully queried the Prometheus API." The `nexorithm` dashboard has 12 panels for request rate, p95 latency, submissions, queue depth, active jobs, execution p95, HTTP errors, timeouts, worker availability, queue wait, worker failures and cleanup failures.

`monitoring/alerts.yml` is loaded. WorkerUnavailable fired after `docker compose stop` of the worker. The worker was started again and returned to healthy. ApiUnavailable, QueueBacklog, HighHttpErrorRate and ExcessiveExecutionTimeouts are loaded. No Alertmanager route exists, so no page was sent.

Logs include request id, submission id, job id, operation, duration, outcome and error category. Authorization, password, token and source fields are redacted. The submitted marker string was not logged.

Counters reset on process restart. After a worker restart, `nx_verdicts_total` only showed the latest timeout. At one scrape the API's `nx_submissions_total` was 16. Queue depth, worker failures and cleanup failures were 0 after recovery.

## 9. Frontend optimization

The entry previously shipped Monaco. The measured pre-split Vite entry was `index-*.js` at 4,127.22 kB minified and 1,069.71 kB gzip.

The served container, built after route splitting and a Monaco import that loads only the editor API plus the JavaScript and Python contributions, has:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| `index-gSBH793K.js` | 235,976 bytes | 74,657 bytes |
| `editor.api2-C1WF0-a4.js` | 3,622,389 bytes | 915,778 bytes |
| `HomePage-*.js` | 30,613 bytes | not separately recorded |
| `WorkspacePage-*.js` | 89,756 bytes | not separately recorded |

`index.html` preloads the entry, not Monaco. The browser fetched `editor.api2` only after opening a problem, and `.monaco-editor` was present. TypeScript and editor workers still load with the editor. They are large and were left there because the editor needs them.

Playwright's four flows passed after the split, including a visible Monaco editor. The browser then confirmed signup, the editor, a live Wrong Answer verdict and history.

## 10. Infrastructure

Local Compose builds and health checks passed for frontend, Grafana, API, worker, MongoDB, Redis and Prometheus. The worker image contains a static Docker client and runs as the `node` user with the socket group. Frontend nginx runs unprivileged. Its entrypoint cannot rewrite the read-only `default.conf` mount; the published config is already valid and the health check returned 200.

`docker-compose.production.yml` renders the `runsc` and mTLS shape. It was not applied to a host. Image builds are local tags. GHCR publishing was not run.

Workflows on disk:

- `quality.yml` runs the static and test commands.
- `sandbox.yml` is `workflow_dispatch` on a self-hosted Linux runner and expects `runsc`.
- `docker.yml` publishes SHA tags after Quality succeeds on `main`.
- `frontend_deploy.yaml` is manual and targets S3/CloudFront.

Those files were reviewed. They were not executed on GitHub. A green local tree is not a green cloud run.

## 11. Remaining issues

- gVisor is blocked. Public execution must stay off.
- JavaScript memory exhaustion is Time Limit Exceeded at the default 5 second budget.
- A worker `SIGKILL` does not instantly remove the sandbox. The inner timeout does.
- Mongo pause was not re-measured as a clean 503 after the first recovery.
- The post-execution, pre-database crash was not injected outside the stubbed integration tests.
- k6 at 250 and 500 virtual users was not run. Completion-mode k6 was not run.
- Alert delivery is blocked. No paging credentials.
- Google OAuth is blocked. No client id.
- Cloud CI, staging and production were not tested.
- The git working tree is dirty and diverged from `origin/main`. The verified bits are not a single pushed commit.
- Metric series reset on restart, so a dashboard can under-count after a deploy.

## 12. Resume evidence

These bullets use only results from this run.

- Verified an asynchronous judge on a local Docker stack: HTTP 202, MongoDB, BullMQ and a worker executed real Python and JavaScript submissions to Accepted, Wrong Answer, Runtime Error, Compile Error, Time Limit Exceeded and Output Limit Exceeded verdicts, with owner checks and hidden tests withheld.
- Verified per-test container limits on Docker `runc` (non-root, read-only root, no network, dropped capabilities, memory and output caps, cleanup) and confirmed production startup fails closed when gVisor `runsc` is absent.
- Cut the served frontend entry from 4,127 kB minified (1,070 kB gzip) to 236 kB (75 kB gzip) by loading Monaco on the editor route, and measured 100-VU local read traffic at 89 rps with p50 4 ms, p95 471 ms and zero HTTP failures.

## 13. Interview explanation

A person submits code in the browser. The API checks the token and the payload, stores the submission in MongoDB, and returns 202 with an id. It does not run the code. Redis holds a BullMQ job that points at that id. A separate worker claims the row with a lease, starts a fresh container for each test, compares output, and writes the verdict back only if it still owns the lease.

The hard part is the boundary around someone else's program. The container has no network, no root, a read-only filesystem, a small memory and process budget, and a kill timeout. On this Mac that boundary is Docker's ordinary runtime, and the worker refuses to start in production unless gVisor is actually installed. The second hard part is a worker dying in the middle. The database row is the source of truth, the lease stops a stale worker from overwriting a newer result, and a reconciler puts a queued row back on Redis if the job went missing. The third is telling the truth about speed: the API can answer reads quickly, while one worker on this machine finishes a few Python judgments a second, and those are not the same measurement.

## 14. Later reliability follow-up

The findings above are the 2026-10-28 verification and are unchanged. A later pass fixed worker-crash cleanup, readiness during a real MongoDB pause, and the enqueue hang while Redis was paused. Those measurements are in `FINAL_RELIABILITY_REPORT.md`. This file is not a claim that gVisor or public execution was verified.
