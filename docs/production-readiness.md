# Production readiness

Nexorithm is not ready for public untrusted-code execution.

## Verified on this Mac

- The Compose stack runs on Docker Desktop with `runc`.
- Python and JavaScript submissions reach real containers.
- A separate reaper removes labeled sandboxes after a worker `SIGKILL`, in about 12 seconds in the measured runs.
- Readiness fails while Redis or MongoDB is paused and recovers after unpause.
- Production Compose renders `runsc`, refuses the weak sandbox, and sends the worker and the reaper to the mTLS runtime endpoint instead of the host socket.
- A worker set to `runsc`, or set to production with `runc` and the weak flag off, exits instead of downgrading.

## Blocked

- `docker info` lists `runc` and `io.containerd.runc.v2`. It does not list `runsc`.
- No Linux gVisor runner was available. No cloud machine was created.
- GitHub Actions were not executed.
- Google OAuth has no client id.
- Prometheus can fire `WorkerUnavailable`. Nothing pages an operator.

## Required before public submissions

1. A dedicated Linux host with `runsc` registered.
2. `docker compose -f docker-compose.yml -f docker-compose.production.yml up` against that host's mTLS endpoint.
3. `npm run test:security` with `SANDBOX_RUNTIME=runsc` on that host.
4. The same crash and cleanup checks against that runtime.
5. An authorized decision to accept public code. This repository does not make that decision.
