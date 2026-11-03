# Reliability verification

Local Docker Desktop only. 2026-10-28. `runsc` is not installed.

## Readiness

Samples were taken while `docker inspect` still reported the dependency paused, and again before it was unpaused.

| Outage | Live | Ready | Ready time | Dependencies | Still paused at sample |
| --- | ---: | ---: | ---: | --- | --- |
| Redis | 200 | 503 | 2,242 ms | redis | yes |
| MongoDB | 200 | 503 | 2,233 ms | mongodb | yes |
| Both | 200 | 503 | 2,196 ms | mongodb, redis | yes |

Recovery to ready was 235 ms after Redis unpaused and 225 ms after MongoDB unpaused. Liveness does not check either dependency. Readiness pings MongoDB and asks Redis for queue counts, each with a 2 second budget.

A paused Redis used to leave `queue.add` waiting, so nginx returned an HTML 502 at its proxy timeout. The queue client now fails a command after 2 seconds. The API keeps the MongoDB row and returns 202. The worker connection does not use that command timeout, because BullMQ blocks on its own connection.

## Queue

A submission created while Redis was paused stayed `queued` for the whole paused sample. After unpause it became Accepted in 2,539 ms. One document.

Delivering the same job id again after completion left the verdict Accepted, the attempt at 1, and the document count at 1.

## Worker crashes

See `docs/worker-recovery-tests.md` for the six scenarios and the times.

## What this does not prove

- gVisor
- A Linux host
- GitHub Actions
- Alert delivery
- That concurrency above 1 is faster on this machine
