# Execution security

Untrusted code runs only in a disposable container created by the judge worker. Production startup fails unless `SANDBOX_RUNTIME=runsc`; runc can be enabled only outside production with `ALLOW_WEAK_SANDBOX=true`. Runtime images are pinned by version and must be pre-pulled. Production operators should replace tags with verified digests after mirroring them.

Controls: no network; uid/gid 65534; read-only root; 16 MiB noexec/nosuid/nodev tmpfs; empty environment; no host data mount; no Docker socket; all capabilities dropped; no privilege escalation; 1 CPU; 256 MiB RAM/swap; 32 pids; 64 file descriptors; 16 MiB file size; 1 MiB combined output; 5-second wall time per test; 60-second suite budget. Timeout or output overflow forcibly removes the container, then orphan reconciliation checks labeled sandboxes.

Function invocation uses trusted problem metadata. Existing problems derive a deterministic function name from both trusted starter snippets; new problems should store `execution.functionName`, input mode and comparison. Inputs are structured JSON arguments where configured. Supported comparisons are JSON value, exact, explicit trim and explicit float tolerance.

Residual risks remain. A container runtime controls a privileged host service and ordinary namespaces share a kernel. gVisor materially narrows the kernel interface, but it is not a mathematical security guarantee. The worker host must be dedicated, patched, isolated from application networks, and disposable. Runtime-daemon credentials permit sandbox lifecycle operations and must be scoped at the network and host boundary. Public submission traffic is unsuitable until the behavioral security suite passes on that deployment.

Verification is in `Backend/tests/security/sandbox.test.ts`. It checks timeouts, output limits, syntax/runtime failures, host/socket/secret denial, read-only root, non-root execution, network denial and cleanup. Set `RUN_SANDBOX_SECURITY=1` only on a disposable isolated Linux runner with runsc.
