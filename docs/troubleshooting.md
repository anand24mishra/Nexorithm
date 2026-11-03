# Troubleshooting

- Worker refuses startup: confirm Docker is reachable, `docker info` lists the configured runtime, and both pinned runtime images are already present.
- Submissions remain queued: check API/worker readiness, Redis, worker logs and Mongo queued records. Reconciliation runs every ten seconds and reconstructs absent jobs.
- Submission becomes System Error: inspect structured worker logs by submission/job id; retry exhaustion or expired leases are recorded in `errorCategory`.
- Sandbox cleanup failure: stop admissions, isolate the worker, list containers with label `nexorithm.sandbox=true`, investigate runtime health, then restore service only after cleanup succeeds.
- Metrics return 401: supply the bearer metrics token and ensure Prometheus's credentials file contains precisely that token.
- Problem returns 422: add authoritative tests and explicit execution metadata, or compatible Python and JavaScript starter signatures.
