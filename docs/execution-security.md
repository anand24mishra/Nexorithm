# Execution security

Untrusted source runs only in a container created by the judge worker. The API does not execute it and does not mount the Docker socket. Production startup fails unless `SANDBOX_RUNTIME=runsc`. `runc` is accepted only when `NODE_ENV` is not `production` and `ALLOW_WEAK_SANDBOX=true`.

The recorded local verification used `SANDBOX_RUNTIME=runc` and `ALLOW_WEAK_SANDBOX=true` on Docker Desktop. gVisor `runsc` was not installed and was not tested. That run is not evidence that public untrusted code is safe. `docker-compose.production.yml` still selects `runsc` and `ALLOW_WEAK_SANDBOX=false`.

## Container flags

`Backend/src/services/executorFactory.ts` passes these to `docker create`:

- `--pull=never`
- `--runtime` from `SANDBOX_RUNTIME`
- `--network=none`
- `--user=65534:65534`
- `--read-only`
- `--tmpfs /tmp:rw,noexec,nosuid,nodev,size=16777216,mode=1777`
- `--workdir=/tmp`
- `--cap-drop=ALL`
- `--security-opt=no-new-privileges:true`
- `--pids-limit` (default 32)
- `--memory` and `--memory-swap` (default 256m)
- `--cpus` (default 1)
- `--ulimit fsize=16777216:16777216`
- `--ulimit nofile=64:64`
- `--log-driver=none`
- `timeout --signal=KILL` inside the container

No host directory and no Docker socket are mounted into the sandbox. The program is sent on stdin. Images must already be present (`--pull=never`). Defaults are `python:3.12.10-slim-bookworm` and `node:22.15.0-bookworm-slim`.

The worker and the reaper containers themselves drop all capabilities, set `no-new-privileges`, and use a read-only root. They are the trusted controllers. Their socket access is still a privileged credential and belongs on a dedicated host.

## What else is enforced in code

- Request bodies are limited, and submission payloads are checked with Zod.
- JWTs are verified on submission routes. Reads are filtered to the owner.
- Queue jobs carry identifiers, not source or hidden tests.
- Output returned to the client is bounded. Hidden tests are not echoed back.
- `/metrics` requires `Authorization: Bearer` matching `METRICS_TOKEN`.

## What this does not prove

A container runtime is a privileged host service. `runc` shares the kernel with the host. gVisor reduces that shared surface only when `runsc` is the runtime that actually starts the container. It was not verified here, and it is not a formal proof against escape.

Account creation has a login rate limit and a per-user submission limit. That does not stop a large set of accounts from filling the queue. There is no pager: `monitoring/alerts.yml` is loaded by Prometheus, and nothing in this repo delivers those alerts.

`Backend/tests/security/sandbox.test.ts` refuses to run unless `RUN_SANDBOX_SECURITY=1`. The GitHub workflow that sets `SANDBOX_RUNTIME=runsc` is manual and targets a self-hosted Linux runner. A development run against Docker Desktop `runc` does not satisfy that gate.
