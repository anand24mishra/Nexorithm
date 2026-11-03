# Worker recovery tests

Harness: `node scripts/reliability-harness.mjs`

It polls submission state and container state until a deadline. It does not treat a single sleep as success. Redis and MongoDB are unpaused in `finally`. The harness refuses `docker compose start` until those dependencies are healthy again, because a pause marks them unhealthy until the next successful check.

Date: 2026-10-28. Docker Desktop `runc`. Worker concurrency 1 except during the throughput rows. Git HEAD `fcb2542` plus the uncommitted tree.

| Scenario | Result | Evidence |
| --- | --- | --- |
| A. Worker stopped before the job | Pass | Submission stayed `queued`. After start it became Accepted. One document. Poll finished in 20 ms because the worker was already healthy. |
| B. `SIGKILL` during an infinite loop | Pass | Reaper stayed up. Sandbox stopped running at 7,007 ms and was removed at 12,151 ms. Final verdict Time Limit Exceeded, attempt 2, one document. Recovery poll 79,999 ms. |
| C. Exit after execution, before the Mongo completion | Pass | Status was still `running` after the worker exited 137. Replacement worker completed it as Accepted, attempt 2, one document. Recovery poll 80,139 ms. |
| D. Same BullMQ job id delivered again after completion | Pass | Status stayed Accepted, attempt stayed 1, one document. |
| E. Submit while Redis is paused | Pass | HTTP returned while Redis was still paused and the row was `queued`. After unpause the reconciler completed it as Accepted in 2,539 ms. One document. |
| F. `SIGTERM` during an infinite loop | Pass | Verdict Time Limit Exceeded in 5,015 ms. No sandbox remained. |

The duplicate-delivery and missing-job paths are also covered by 14 integration tests against Mongo `nexorithm_test` and Redis database 15. Those tests stub the executor.

`FAULT_AFTER_EXECUTION=crash` is ignored when `NODE_ENV=production`. The checkpoint calls `process.exit(137)`. Signaling PID 1 with `SIGKILL` from inside this container returned success and left the process alive, so that signal is not the crash mechanism.

The 80 second recovery times match the 90 second lease plus the 10 second reconcile interval and one more execution. The harness also passes `LEASE_MS=8000` to the fault worker. This run did not get an 8 second recovery, so the effective bound to quote is the 90 second lease.
