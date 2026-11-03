# Observability

Pino emits JSON records with request, submission, job and worker correlation where available, operation, duration, outcome and error category. Redaction covers authorization, tokens, passwords and source fields; source and hidden tests are not logged.

Prometheus endpoints on API and worker require `Authorization: Bearer $METRICS_TOKEN`. Metrics cover HTTP count/latency, submissions/language, verdicts, queue wait/depth, worker active/failures, execution duration, sandbox startup and cleanup failure. Labels avoid user and submission identifiers. Grafana provisioning provides throughput, latency, error, queue, worker, execution, timeout and availability panels.

`monitoring/alerts.yml` is mounted into Prometheus. The rules are ApiUnavailable, WorkerUnavailable, QueueBacklog, HighHttpErrorRate and ExcessiveExecutionTimeouts. On 2026-10-28 both scrape targets were up, and WorkerUnavailable fired after the worker container was stopped. No Alertmanager or paging credentials are configured, so delivery was not tested. Counters reset when the API or worker process restarts.

`/health/live` proves the process is running. `/health/ready` checks shutdown state and critical database/queue access; transient dependency failure does not make liveness fail.
