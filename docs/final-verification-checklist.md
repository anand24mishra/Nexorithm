# Final verification checklist

Date: 2026-10-28. Host: Darwin 25.6.0 arm64, Apple M3, 8 GB RAM. Git: `main` at `fcb2542` (`ci: deploy frontend to S3 and CloudFront`, 2026-09-20), ahead 1 and behind 2 of `origin/main` (`https://github.com/rajatrsrivastav/Nexorithm.git`). The working tree is dirty. Nothing was committed or pushed.

Statuses mean what was done on this machine unless a row says otherwise.

## Phase A — repository and environment

| Check | Status | Evidence |
| --- | --- | --- |
| Repository inspected | Passed | Backend, Frontend, Compose, monitoring, benchmarks, workflows and docs were read before changes. |
| Git state recorded | Passed | `main` at `fcb2542`, dirty working tree, no commit. |
| Node and npm | Passed | Node v24.15.0, npm 11.12.1. |
| Docker CLI, daemon and Compose | Passed | Client and engine 29.1.3, Compose v2.40.3. The daemon was initially stopped and was started with Docker Desktop. |
| Architecture | Passed | Host arm64. Engine reports linux/arm64. |
| Disk space | Passed | The build proceeded after Docker build cache was pruned. Unrelated containers were not removed. |
| gVisor | Blocked | `docker info` lists `runc` and `io.containerd.runc.v2`. `runsc` is absent. |
| Existing `.env` | Passed | A gitignored local `.env` was created for this run and was not printed. It was not replaced after creation. |

## Phase B — Docker stack

| Check | Status | Evidence |
| --- | --- | --- |
| Compose config | Passed | `docker compose config` succeeded. Production override rendered `runsc`, weak sandbox off, `NODE_ENV=production`, and the mTLS runtime endpoint. |
| Image build | Passed | `nexorithm-backend-api`, `nexorithm-judge-worker` and `nexorithm-frontend` built. |
| MongoDB and Redis | Passed | Both containers reported healthy. |
| API and worker | Passed | Both reported healthy after the readiness timeout change. |
| Frontend | Passed | `http://127.0.0.1:8088` served the app. Port 8080 was already used by an unrelated container and was left alone. |
| Prometheus | Passed | Targets `backend-api:8000` and `judge-worker:9091` were up. |
| Grafana | Passed | `http://127.0.0.1:3001/api/health` reported database ok. Datasource health queried Prometheus successfully. Port 3000 was already used on the host. |

## Phase C — execution

| Check | Status | Evidence |
| --- | --- | --- |
| HTTP 202 and queued state | Passed | Live submissions returned 202 and a submission id. Status was observed as queued or running before a terminal verdict. |
| Python accepted, wrong answer, runtime, compile, timeout, output limit, memory limit | Passed | Live API verdicts on the Docker worker. Python memory exhaustion was Memory Limit Exceeded in about 1.8 seconds. |
| JavaScript equivalent cases | Passed | Accepted, Wrong Answer, Runtime Error, Compile Error, Time Limit Exceeded and Output Limit Exceeded. |
| JavaScript memory verdict at the default 5 second budget | Failed | The cgroup kill takes about 8.5 seconds, so the default budget returns Time Limit Exceeded. At a 15 second budget the same program returned Memory Limit Exceeded in 8,546 ms. The budget was restored to 5,000 ms. |
| Hidden tests omitted | Passed | A contract problem with a hidden input was judged Accepted. The problem and submission responses did not contain that input. |
| Owner isolation | Passed | A second user received 404 for the first user's submission. |
| Invalid submissions | Passed | Blank code returned 400. An unknown problem returned 404. |
| Frontend verdict and history | Passed | Browser signup reached the dashboard. The Two Sum editor loaded Monaco. Submit showed Wrong Answer. History showed one JavaScript submission at 2,818 ms. |
| Google OAuth | Blocked | Provider client ids are empty. The signup page says Google sign-in is not configured. |

## Phase D — sandbox

| Check | Status | Evidence |
| --- | --- | --- |
| Non-root, read-only root, no Docker socket, no secret env, no network, process limit, timeout cleanup | Passed | `RUN_SANDBOX_SECURITY=1` on `runc`: 19 tests passed. No sandbox containers remained. |
| Linux capabilities, cgroup limits and `no-new-privileges` | Passed | Applied by the worker's `docker create` arguments and covered by the passing suite. This is `runc` on Docker Desktop, not gVisor. |
| gVisor `runsc` | Blocked | Runtime is not installed. A one-off production worker with `SANDBOX_RUNTIME=runsc` exited with required runtime unavailable. A production worker forced to `runc` with the weak flag off also exited. No downgrade. |
| Public hostile-code acceptance | Failed | Not claimed. The required production runtime was not verified. |

## Phase E — reliability

| Check | Status | Evidence |
| --- | --- | --- |
| Worker stopped before processing | Passed | Submission stayed queued and completed Accepted after the worker started. |
| Worker killed during execution | Passed | Sandbox still present 3 seconds after `SIGKILL`, then removed. Final verdict Time Limit Exceeded. |
| Redis pause | Passed | Live stayed 200. Ready returned unavailable within the 2 second budget, then 200 after unpause. |
| Mongo pause | Not executed | An earlier script paused Mongo and the stack was recovered. A clean 503 measurement was not repeated. |
| Duplicate delivery, stale lease, queued record without Redis | Passed | Covered by 14 integration tests against Mongo `nexorithm_test` and Redis database 15. Those tests stub execution. |
| Crash after execution and before the database write | Not executed | No separate fault was injected at that exact point beyond the lease tests. |
| Idempotent completion and lease fencing | Passed | Integration tests. Lease is 90 seconds. Attempts are capped at 3. Reconciliation interval is 10 seconds. |

## Phase F — benchmarks

| Check | Status | Evidence |
| --- | --- | --- |
| k6 read scenarios, 10, 50 and 100 VU | Passed | Zero HTTP failures. Details are in `docs/performance-benchmarks.md`. |
| 250 and 500 VU | Not executed | p95 was already 471 ms at 100 VU on a 4 GB VM. |
| Completed-judgment throughput | Passed | Three Python jobs, one worker: 7.8 seconds, all Accepted, about 0.38 judgments per second. |
| k6 enqueue or completion mode | Not executed | The per-user limit is 10 submissions per minute, so that scenario would mostly return 429. |

## Phase G — observability

| Check | Status | Evidence |
| --- | --- | --- |
| Prometheus scrape | Passed | API and worker targets up. Bearer token required. |
| Grafana dashboard | Passed | Datasource ok. Dashboard `nexorithm` loaded with 12 panels. |
| Alert rule evaluation | Passed | WorkerUnavailable fired after the worker was stopped. The worker was started again. |
| Alert delivery | Blocked | No Alertmanager or paging credentials. |
| Structured logs | Passed | Records include request, submission, job, operation, duration, outcome and error category. A marker placed in submitted source was absent from logs. |

## Phase H — frontend

| Check | Status | Evidence |
| --- | --- | --- |
| Entry bundle reduced | Passed | Served `index-*.js` is 235,976 bytes, gzip 74,657 bytes. The pre-split entry was 4,127.22 kB minified and 1,069.71 kB gzip. |
| Monaco stays off the entry | Passed | The problem route loaded `editor.api2-C1WF0-a4.js` (3,622,389 bytes). The home document did not preload it. |
| Existing frontend tests | Passed | 18 unit tests and 4 Playwright tests passed. ESLint reported 0 warnings. |
| Browser editor behavior | Passed | Monaco initialized, a real submission rendered Wrong Answer, and history updated. |

## Phase I — auth and API

| Check | Status | Evidence |
| --- | --- | --- |
| Missing, expired and bad-signature tokens | Passed | Each returned 401. `alg: none` is rejected by the JWT library. |
| Cross-user submission read | Passed | 404. |
| Rate limit response | Passed | 429 with `Content-Type: application/json` and body `{"error":"Too many requests"}`. |
| CORS | Passed | Allowed origin `http://localhost:8088`. Rejected `http://evil.example`. |
| Security headers | Passed | API responses have a single `nosniff`, `no-referrer` and an `x-request-id`. |
| Google OAuth | Blocked | No provider credentials. |

## Phase J — automated tests and CI

| Check | Status | Evidence |
| --- | --- | --- |
| Backend unit | Passed | 33 tests. |
| Backend integration | Passed | 14 tests. Executor stubbed. |
| Backend security | Passed | 19 tests on `runc`. |
| Backend typecheck, ESLint, Prettier, audit | Passed | Audit reported 0 high vulnerabilities. |
| Frontend unit, typecheck, ESLint, audit | Passed | 18 tests. ESLint 0 warnings. Audit 0 high. |
| Playwright | Passed | 4 tests. They stub HTTP and do not certify the sandbox. |
| Workflow files reviewed | Passed | Commands, permissions and the self-hosted `runsc` gate were inspected. |
| GitHub-hosted CI | Not executed | No cloud workflow run was started. |

## Phase K — documentation

| Check | Status | Evidence |
| --- | --- | --- |
| Verification docs updated from this run | Passed | This checklist, the sandbox report, benchmark notes, deployment notes and `FINAL_VERIFICATION_REPORT.md`. |
| Production-ready claim | Failed | Intentionally withheld. `runsc` was not verified. |
