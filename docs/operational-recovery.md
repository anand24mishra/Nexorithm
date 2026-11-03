# Operational recovery

On API restart, readiness stays false until MongoDB and Redis respond; queued Mongo records survive. Readiness probes Redis with a two-second budget and returns HTTP 503 when that budget expires. Liveness stays available. On Redis loss, submission creation persists first and returns the id; reconciliation enqueues after recovery. On worker restart, BullMQ detects stalled jobs and expired Mongo leases are requeued with a new fencing token.

Observed on the local stack on 2026-10-28:

- Stopping the worker left a new submission queued. Starting the worker completed it as Accepted.
- `SIGKILL` during an infinite loop left the sandbox running. It stopped running at 7.0 seconds and the independent reaper removed it at 12.2 seconds. The submission later completed once as Time Limit Exceeded on attempt 2. `SIGTERM` finished the same kind of job in 5.0 seconds and left no sandbox.
- Pausing Redis or MongoDB, including both together, kept liveness at 200 and made readiness return 503 with that dependency named. The sample was taken while the container was still paused. A paused Redis used to hang enqueue until nginx returned HTML. The queue command timeout is now 2 seconds, and a submission created during the pause stayed queued and then completed after unpause.
- A production-mode worker with `SANDBOX_RUNTIME=runc` exited. A worker with `SANDBOX_RUNTIME=runsc` exited because that runtime is not installed. Neither downgraded to `runc`.

If the runtime daemon fails, stop worker admissions, preserve queue/database state, remediate the dedicated runtime host and restart the worker. It reaps expired labeled sandboxes before processing. Cleanup failure is fatal to that execution and increments an alertable metric.

For queue saturation, keep API reads online, return 503 for new work, add verified workers or reduce arrival rate, and monitor queue wait. Never increase concurrency beyond host capacity without repeating security and saturation tests.
