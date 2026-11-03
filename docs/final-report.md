# Nexorithm production engineering upgrade — final report

Verification date: 2026-10-27 (Asia/Kolkata)

This report distinguishes implemented behavior from behavior that could be verified on the current macOS host. It does not claim sandbox guarantees or performance results that were not exercised.

## A. Architecture changes

### Before

The Express process synchronously executed submitted source through shell-oriented child-process calls. Submission requests waited for judging, runtime discovery was brittle, queue recovery and durable status transitions were absent, and the frontend assumed a synchronous response.

### After

The API authenticates and validates a submission, persists a durable `queued` record, and returns HTTP 202. A BullMQ producer publishes only identifiers and safe correlation data. A separately started worker loads authoritative problem data, atomically leases the submission, invokes an ephemeral restricted runtime container, calculates the verdict, and performs a lease-fenced terminal update. MongoDB remains the durable source of truth; Redis is delivery infrastructure. A reconciliation process repairs the MongoDB-to-Redis failure window and stale leases. The frontend polls owner-scoped status endpoints until a terminal state.

The component and sequence diagrams are in [architecture.md](architecture.md) and [submission-lifecycle.md](submission-lifecycle.md).

## B. Important files changed

### API, queue, and persistence

- `Backend/src/index.ts`, `controllers/submit.controller.ts`, `routes/submit.routes.ts`
- `Backend/src/services/submission.service.ts`, `services/judge.service.ts`
- `Backend/src/models/Submission.model.ts`
- `Backend/src/repositories/AsyncSubmissionRepository.ts`
- `Backend/src/queue/queue.ts`, `processor.ts`, `worker.ts`, `reconcile.ts`, `state.ts`
- `Backend/src/scripts/migrate.ts`, `retention.ts`

### Sandbox and judging

- `Backend/src/services/executorFactory.ts`, `runners.ts`, `contracts.ts`, `comparison.ts`
- `Backend/src/config/execution.ts`
- `Backend/tests/security/executor.security.test.ts`

### Frontend

- `Frontend/src/hooks/useSubmission.ts`, `pollSubmission.ts`, `useSubmissionHistory.ts`
- `Frontend/src/api/submissionApi.ts`, `submissionHistoryApi.ts`
- `Frontend/src/components/Workspace/SubmissionStatus.tsx`
- `Frontend/src/pages/WorkspacePage.tsx`, `AnalyticsPage.tsx`
- `Frontend/e2e/submission.spec.ts`

### Operations and delivery

- `docker-compose.yml`, `docker-compose.production.yml`
- `Backend/Dockerfile`, `Frontend/Dockerfile`, `Frontend/nginx.conf`
- `.github/workflows/quality.yml`, `docker.yml`, `sandbox.yml`, `frontend_deploy.yaml`
- `monitoring/prometheus.yml`, `monitoring/grafana/**`
- `k6-loadtest.js`, `benchmarks/run-scenarios.sh`
- `.env.example`, `Backend/.env.example`, `Frontend/.env.example`

### Documentation

The README and all requested documents under `docs/` were created or updated, including the audit, security model, deployment, migration, observability, testing, benchmark, troubleshooting, decision, and recovery guides.

## C. Feature checklist

- [x] HTTP 202 asynchronous submission creation
- [x] BullMQ queue with bounded infrastructure retries and exponential backoff
- [x] Dedicated worker entrypoint and configurable concurrency
- [x] Centralized state transitions, worker lease fencing, duplicate-completion protection
- [x] Durable enqueue intent and queued/stale-running reconciliation
- [x] Owner-only status and paginated history endpoints
- [x] Deterministic Python `Solution` and JavaScript function contracts from trusted metadata
- [x] Exact, normalized, structured JSON, and configured floating-point comparisons
- [x] Explicit compilation, runtime, timeout, memory, output, and system verdicts
- [x] Polling UI with queued/running/terminal/error states, cancellation, retry, and pagination
- [x] Pino structured logging, correlation fields, Prometheus metrics, Grafana provisioning
- [x] API liveness/readiness endpoints and Compose health checks
- [x] Multi-stage non-root application images and local/production Compose configurations
- [x] Unit, integration, frontend, browser, and controlled sandbox-security test suites
- [x] k6 workload profiles for 10, 50, 100, 250, and 500 virtual users
- [x] Migration and bounded retention utilities

## D. Security improvements

Infrastructure commands use `spawn` with argument arrays and `shell: false`; submitted code is never interpolated into a host shell command. The API does not execute code. The trusted worker creates an ephemeral container with no network, a read-only root filesystem, non-root UID, a dedicated tmpfs, dropped capabilities, `no-new-privileges`, CPU/memory/PID/file/output/wall limits, an empty controlled environment, and unconditional cleanup. Runtime images and the execution contract are selected from trusted configuration.

Production configuration requires the `runsc` runtime and fails closed when it is unavailable. The production Compose override points the worker at a dedicated mutually authenticated runtime endpoint rather than mounting a Docker socket in the API. Submitted-code containers never receive the runtime socket, application network, database credentials, or Redis credentials.

Docker plus seccomp is not treated as a complete hostile-code boundary. The intended public-production boundary is gVisor on a dedicated runner host/VM; kernel escape, runtime-daemon compromise, resource-accounting variance, and operator misconfiguration remain residual risks. See [execution-security.md](execution-security.md) and [security-threat-model.md](security-threat-model.md).

API hardening includes JWT claim and algorithm checks, owner authorization, Zod boundary validation, request-size limits, CORS allowlisting, Helmet headers, authentication/submission rate limits, safe errors, bounded persisted output, and protected metrics.

## E. Verification and tests

### Passed on this host

| Check | Result |
| --- | ---: |
| Backend build and TypeScript check | passed |
| Backend ESLint and Prettier check | passed |
| Backend unit tests | 33 passed, 0 failed, 0 skipped |
| Backend integration tests with isolated MongoDB/Redis | 14 passed, 0 failed, 0 skipped |
| Frontend production build and TypeScript check | passed |
| Frontend ESLint | passed with 0 errors and 6 hook-dependency warnings |
| Frontend Prettier check | passed |
| Frontend unit tests | 18 passed, 0 failed, 0 skipped |
| Playwright end-to-end tests | 4 passed, 0 failed, 0 skipped |
| Backend and frontend high-severity npm audits | 0 vulnerabilities reported |
| Local and production Compose config rendering | passed |
| Git patch whitespace validation | passed |

The 69 executed automated tests cover judge precedence and comparison, state transitions, retry classification, configuration and factory behavior, ownership, queue insertion, worker completion and recovery, duplicate jobs, authentication, frontend polling and rendering, and browser flows for accepted, wrong-answer, timeout, and worker-status failure.

### Not executed in this environment

The Docker daemon was unavailable (`docker info` returned non-zero). Consequently, container image builds, `docker compose up --build`, behavioral sandbox security tests, real Python/JavaScript runtime execution, gVisor enforcement, resource/network isolation, orphan/container cleanup, and a complete live API-to-worker-to-sandbox flow remain unverified here. The security suite exists but was not run or counted as skipped. These checks must run on the controlled Linux runner described in [testing.md](testing.md).

## F. Performance

No benchmark scenarios were executed because the Docker-backed judge stack was unavailable. No throughput or latency values are claimed. The versioned k6 scenarios, measurement fields, and result template are in [performance-benchmarks.md](performance-benchmarks.md).

The frontend production build succeeded but reports a large main Monaco/application chunk (approximately 4.13 MB minified, 1.07 MB gzip). This is a measured build artifact size, not a runtime performance result.

## G. Deployment

For local setup, copy the environment templates, use a strong JWT secret, then run `docker compose up --build`. Local Docker/runc mode is explicitly marked weaker and must not accept public hostile submissions.

Before production, provision a dedicated Linux runner with gVisor, configure the mutually authenticated runtime endpoint and certificates, pin/scan the runtime images, run the sandbox workflow, confirm cleanup behavior, rotate production secrets, and validate backups, dashboards, alerts, and capacity. Follow [deployment.md](deployment.md), [environment-variables.md](environment-variables.md), and [operational-recovery.md](operational-recovery.md).

No production deployment, push, or external infrastructure change was performed.

## H. Remaining limitations

### Implemented and verified

Async API/queue persistence logic, state fencing and reconciliation behavior, authorization, validation, verdict logic, frontend polling/history behavior, builds, static quality checks, manifests, and unit/integration/browser tests.

### Implemented but not verified on this host

Restricted container execution, gVisor fail-closed operation, Python/JavaScript behavioral execution, resource-limit enforcement, network/file/process attacks, container cleanup, image builds, full Compose startup, metrics/dashboard runtime behavior, and restart recovery against live containers.

### Partially implemented

Correlation uses structured request/submission/job identifiers rather than a full OpenTelemetry backend. Queue overload is bounded by admission/concurrency controls but does not implement global distributed fair scheduling. Monaco is self-hosted but still needs route/editor code splitting to reduce the main bundle.

### Not implemented

WebSockets, additional languages, Kubernetes, automatic production deployment, and fabricated benchmark targets were intentionally excluded. Google OAuth was preserved but requires real provider credentials for a live verification pass.

### Environment or credential blockers

No running Docker daemon/gVisor host and no deployment/OAuth production credentials were available. These are the only blockers recorded for final runtime/security/deployment verification.

## I. Resume-ready evidence

- Re-architected a synchronous Node/Express code judge into a durable MongoDB + BullMQ pipeline with HTTP 202 submissions, lease-fenced workers, idempotent completion, bounded retries, and crash reconciliation; verified with 47 backend unit/integration tests.
- Implemented a fail-closed ephemeral-container execution layer for Python and JavaScript with deterministic JSON contracts, non-root/read-only/no-network isolation controls, resource/output/time limits, and a documented gVisor production boundary.
- Delivered end-to-end asynchronous UX, owner-scoped paginated history, Prometheus/Grafana observability, reproducible Compose/CI assets, and 22 passing frontend unit/browser tests across accepted, wrong-answer, timeout, and worker-unavailable flows.
