# Known limitations

Verified on 2026-10-28. Categories below are separate. A local pass does not imply a Linux, gVisor, CI, staging or production pass.

## Public execution is disabled

gVisor `runsc` is not installed. Docker Desktop reports runtimes `runc` and `io.containerd.runc.v2` only. The local worker ran with `SANDBOX_RUNTIME=runc` and `ALLOW_WEAK_SANDBOX=true`. That is a development boundary. `docker-compose.production.yml` still selects `runsc` and fails closed. Do not accept public untrusted code on this configuration.

## What this environment did not prove

- No Linux host ran the sandbox suite.
- No `runsc` runtime was registered or tested.
- GitHub Actions were read locally and were not executed in the cloud.
- No staging or production deployment was performed.
- Google OAuth client ids are empty. The signup page reports that Google sign-in is not configured.
- Prometheus evaluates alert rules. No Alertmanager, Slack or pager credentials exist, so delivery was not tested.
- k6 scenarios at 250 and 500 virtual users were not run. The 4 GB Docker VM and rising p95 at 100 virtual users made them inappropriate.
- k6 did not measure completed judgments. The read script sleeps one second per iteration.
- Integration tests use the real MongoDB and Redis services and a stubbed executor. Real container execution was verified through the live API and the sandbox suite.

## Behavioral limits that were observed

- The verdict follows the termination that actually won. Output limit, then a reported memory kill, then the wall clock. A later run on the default 5 second budget classified a Python allocation as Memory Limit Exceeded in 1,421 ms and a JavaScript allocation as Memory Limit Exceeded in 2,981 ms. An earlier run on the same budget classified the JavaScript case as Time Limit Exceeded because the wall clock fired first. The classifier does not relabel a timeout as a memory limit.
- On this VM, four Python Two Sum jobs at concurrency 1 finished in 8.0 seconds (0.50 judgments/s). Concurrency 2 and 3 made each judgment slower and did not raise throughput.
- After `SIGKILL`, the sandbox is not removed instantly. The measured removal time was 12.2 seconds. The submission lease is 90 seconds, and the measured requeue completed on the next attempt about 80 seconds after the replacement worker was healthy.
- Metric counters reset when the API or worker process restarts.
- The sandbox security memory assertion accepts either an explicit memory verdict or any non-zero exit. The stronger evidence is the direct executor result: exit 137 and `OOMKilled` for both languages.
- A JavaScript tight write loop previously exhausted the V8 heap before the external output cap. The runner now retries short writes. The live API then returned Output Limit Exceeded.

## Local machine constraints

- Host RAM is 8 GB. The Docker VM has about 4.1 GB.
- Ports 8080 and 3000 were already used by unrelated processes. This project used 8088 and 3001.
- The Desktop socket is `root:root` mode 660. The local worker used `DOCKER_GID=0`. A Linux `docker` group should keep `DOCKER_GID=999`.
- Disk pressure required pruning Docker build cache. Unrelated containers were left running. An older container from this Compose project, `nexorithm-backend-1`, was removed as an orphan and had no project volume.
