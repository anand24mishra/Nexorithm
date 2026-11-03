# Sandbox verification report

Date: 2026-10-28. This report records what ran, where it ran, and what remains unsafe.

## Environment

- Host: Darwin 25.6.0, arm64, Apple M3, 8 GB RAM.
- Docker Desktop 29.1.3. Engine linux/arm64, about 4.1 GB VM memory. Default runtime `runc` 1.3.4. Seccomp is available.
- Registered runtimes: `runc`, `io.containerd.runc.v2`. `runsc` is not installed.
- Images: `python:3.12.10-slim-bookworm`, `node:22.15.0-bookworm-slim`. Both include `timeout`.
- Local worker settings: `SANDBOX_RUNTIME=runc`, `ALLOW_WEAK_SANDBOX=true`, `NODE_ENV` not production, `DOCKER_GID=0` because the Desktop socket is `root:root` mode 660. Worker concurrency 1.
- Default execution policy: 5,000 ms, 256 MB, 1 CPU, 1 MB output, 32 pids.
- Git: `fcb2542` plus the uncommitted engineering tree. No commit was created.

Docker Desktop is not a Linux gVisor runner. Nothing in this report treats it as one.

## Controls that the worker applies

Every test container is created with `--pull=never`, `--network=none`, `--user=65534:65534`, `--read-only`, a noexec tmpfs on `/tmp`, all capabilities dropped, `no-new-privileges`, pid, memory, swap, CPU and output limits, and `log-driver=none`. The inner `timeout` uses `SIGKILL`. The worker checks that the selected runtime appears in `docker info` and that the runtime images are already present.

Production startup requires `runsc`. `ALLOW_WEAK_SANDBOX=true` is ignored when `NODE_ENV=production`.

## Behavioral results on runc

Command shape: from `Backend/`, `RUN_SANDBOX_SECURITY=1 SANDBOX_RUNTIME=runc ALLOW_WEAK_SANDBOX=true NODE_ENV=development npm run test:security`.

Result: 19 passed. Nine Python cases, nine JavaScript cases, and a check that no sandbox container remained. Programs ran inside containers. They were not executed as host processes.

The suite covered:

- accepted Unicode JSON output
- infinite-loop cleanup
- output bound
- a memory-pressure boundary
- a process-creation limit
- runtime and syntax failures
- non-root user, no Docker socket, no JWT environment, no write to the root filesystem
- no connection to `1.1.1.1:53`

The memory assertion in the suite passes on an explicit memory verdict or any non-zero exit. That assertion alone is weak. Direct executor runs are stronger: Python exited 137 with `OOMKilled` in 1,860 ms, and JavaScript exited 137 with `OOMKilled` in 8,537 ms.

Live API classification through the worker:

| Case | Python | JavaScript |
| --- | --- | --- |
| Correct Two Sum | Accepted | Accepted |
| Wrong answer | Wrong Answer | Wrong Answer |
| Runtime exception | Runtime Error | Runtime Error |
| Syntax error | Compile Error | Compile Error |
| Infinite loop | Time Limit Exceeded, about 5.4 s | Time Limit Exceeded |
| Excessive output | Output Limit Exceeded | Output Limit Exceeded |
| Memory exhaustion at 5 s budget | Memory Limit Exceeded, about 1.8 s | Time Limit Exceeded |
| Memory exhaustion at 15 s budget | not re-run | Memory Limit Exceeded, 8,546 ms |
| Missing contract | Runtime Error | Runtime Error |
| Nested data, empty input, Unicode JSON | Accepted, hidden input absent from the response | Accepted, hidden input absent from the response |

After the suite, a container filter for sandbox labels returned zero.

## Fail-closed checks

- `NODE_ENV=production`, `SANDBOX_RUNTIME=runc`, `ALLOW_WEAK_SANDBOX=false`: worker exited. The error category was that the sandbox requires `runsc` and weak mode must be enabled explicitly outside production.
- `SANDBOX_RUNTIME=runsc` with no `runsc` installed: worker exited with required runtime unavailable.
- Neither process started judging, and neither switched to `runc` on its own.
- `docker compose -f docker-compose.yml -f docker-compose.production.yml config` renders `runsc`, weak mode off, production Node, and the certificate volume instead of the host socket. Dummy endpoint values were used. The stack was not deployed.

## Cleanup

An infinite loop was running when the worker received `SIGKILL`. Three seconds later the sandbox container was still up. The inner timeout and the next reap removed it. The submission reached Time Limit Exceeded, and the sandbox filter was empty. A worker crash does not instantly destroy the container. The timeout inside the container is what ends a runaway process.

## Residual risk

- Isolation was proven on Docker Desktop `runc` with seccomp, not on gVisor. Container escapes against `runc` are outside this evidence.
- The worker shares the Desktop engine with other projects. The local socket group is root. That is broader access than a dedicated runtime daemon.
- The JavaScript memory bomb loses the race against the 5 second wall clock, so operators watching only the default verdict will see a timeout rather than a memory verdict.
- A killed worker can leave a sandbox for a few seconds. The inner kill and reap are the cleanup path.
- No hostile-code corpus beyond these bounded cases was run.
- Public submissions must stay disabled until the same suite passes on a Linux host whose `docker info` lists `runsc` and whose worker is started from the production Compose override.

## Independent reaper, later the same day

A worker `SIGKILL` cannot run the worker's `finally` block. A separate `sandbox-reaper` service now lists only containers labeled `nexorithm.sandbox=true`. It removes a running container only after `nexorithm.expires`, and it keeps that container if the Mongo lease token still matches and has not expired. An exited container is kept for 5 seconds so the worker can read its exit state, then removed. The reaper interval is 2 seconds.

Observed after `SIGKILL` while the reaper stayed up: the sandbox stopped running at 7,007 ms and was gone at 12,151 ms. A second run was 6,759 ms and 12,053 ms. Cleanup is not instantaneous. The in-container `timeout` ends the process; the reaper removes the exited container. No unlabeled container is selected. After the suite, the sandbox filter was empty.

The security suite was run again on `runc` after the label change: 19 passed. `runsc` is still not installed.
