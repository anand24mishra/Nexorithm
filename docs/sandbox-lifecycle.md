# Sandbox lifecycle

Every test container is labeled `nexorithm.sandbox=true`, with `nexorithm.created`, `nexorithm.expires`, and, when the worker owns the submission, `nexorithm.submission`, `nexorithm.attempt`, `nexorithm.lease`, and `nexorithm.worker`. The expiry is the per-test timeout plus 15 seconds.

The worker deletes its own container after it has read the exit state. That `finally` block does not run if the worker process is killed. Two mechanisms still bound the container:

1. The `timeout --signal=KILL` process inside the container does not need the worker. For a 5 second budget it fires at about 7 seconds.
2. `sandbox-reaper` is a separate Compose service. Every 2 seconds it lists only `nexorithm.sandbox=true` containers.

Removal rules in `decideSandbox`:

- Running, and expiry is still in the future: keep.
- Running, expiry has passed, and the Mongo lease token matches and is unexpired: keep. A live owner is not treated as stale.
- Running, expiry has passed, and there is no live matching lease: remove.
- Exited within the last 5 seconds, and expiry is still in the future: keep, so the worker can inspect the exit code.
- Otherwise, if it is a labeled sandbox: remove.

The reaper does not select containers without the Nexorithm label.

## Measured bound

After `SIGKILL` of the only worker, with the reaper left running:

- The sandbox stopped running at 7,007 ms.
- The container id was gone at 12,151 ms.
- A repeat was 6,759 ms to stop running and 12,053 ms to disappear.

That is the in-container timeout plus the 5 second inspect grace and the 2 second poll. It is not immediate, and this report does not call it immediate. Nothing remained in the sandbox filter afterward.

`SIGTERM` is different. The worker handles it, waits for the active job, and the job's own cleanup removed the sandbox. The infinite-loop submission finished as Time Limit Exceeded in 5,015 ms with no container left.

Production Compose points the reaper at the same mTLS runtime endpoint as the worker and does not mount the host socket. That file was rendered, not deployed. `runsc` is not installed here.
