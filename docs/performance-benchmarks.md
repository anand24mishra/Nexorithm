# Performance benchmarks

Measured on 2026-10-28 against the local Compose stack. Host: Darwin 25.6.0 arm64, Apple M3, 8 GB RAM. Docker Desktop 29.1.3, engine 29.1.3, default runtime `runc`, about 4.1 GB assigned to the VM. Git HEAD `fcb2542` with a dirty working tree. Worker concurrency 1. k6 2.0.0. Target `http://127.0.0.1:8088`. No gVisor.

`k6-loadtest.js` in `MODE=reads` sleeps one second per iteration, so virtual users approximate offered requests per second. These are not saturation results. Scenarios of 250 and 500 virtual users were not run. No enqueue or completion k6 scenario was run, because the per-user submission limiter is 10 per minute and one worker cannot absorb that arrival rate.

| Scenario | Requests | HTTP rps | Failed | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 VU, 20 s, cap 20 rps | 156 | 7.43 | 0% | 9.86 ms | 2.44 s | not recorded |
| 50 VU, 20 s, cap 50 rps | 960 | 45.69 | 0% | 4.84 ms | 42.03 ms | 191.22 ms |
| 100 VU, 15 s, cap 200 rps | 1,421 | 89.15 | 0% | 4.03 ms | 471.38 ms | 678.41 ms |

The 10 VU p95 includes cold-start outliers up to 3.65 s. Container CPU samples taken after the run were idle and are not load measurements.

Completed judgments were measured separately with three queued Python Two Sum submissions and worker concurrency 1. Wall time was 7,844 ms. All three finished Accepted. Queue waits were 19 ms, 3,812 ms and 5,703 ms. Execution times were 2,360 ms, 1,461 ms and 1,263 ms. That is about 0.38 completed judgments per second for this problem, not an HTTP rate.

No before-and-after optimization of the judge path was measured. The frontend bundle change is recorded in the final verification report.

## Worker throughput, 2026-10-28 later pass

Same host and Docker Desktop VM. Four Two Sum submissions per row. Worker concurrency was set on the container and confirmed with `printenv`. This is not a saturation test.

| Concurrency | Language | Wall | Judgments/s | Queue wait | Execution |
| --- | --- | ---: | ---: | --- | --- |
| 1 | Python | 8,037 ms | 0.498 | 12, 1,862, 3,897, 5,916 ms | 1,339, 1,398, 1,233, 1,217 ms |
| 1 | JavaScript | 5,854 ms | 0.683 | 5, 1,281, 2,656, 4,744 ms | 869, 827, 836, 571 ms |
| 2 | Python | 19,465 ms | 0.205 | 9, 3, 3,766, 15,489 ms | 2,716, 2,847, 3,285, 2,984 ms |
| 3 | Python | 11,717 ms | 0.341 | 25, 13, 14, 5,315 ms | 3,699, 3,665, 3,408, 3,850 ms |

On this 4 GB VM, concurrency 2 and 3 made each Python judgment slower. Concurrency 1 had the highest judgments per second. The worker was returned to concurrency 1.

`benchmarks/judge.js` supports read, enqueue, completion and mixed scenarios with 10, 50, 100, 250 or 500 virtual users. It refuses non-local targets unless `ALLOW_STAGING=1` is deliberately set, uses bounded request rates and records enqueue count, completion count, queue wait and execution duration separately. Submission workloads need multiple test users to avoid the intended per-user admission limit.

For every run record CPU/RAM/OS, Docker/gVisor/runtime versions, image digests, service resource limits, dataset/test complexity, VUs, duration, request rate, worker concurrency, HTTP p50/p95/p99, enqueue/completion throughput, queue wait, execution duration, failures, worker CPU/RAM and observed bottlenecks. Use Prometheus/Grafana for worker resources. Never extrapolate unrun scenarios.
