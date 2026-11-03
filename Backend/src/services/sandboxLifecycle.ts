// Deadlines below are the only reason a labeled sandbox may be removed.
// A running container inside its deadline is never treated as stale.
export const EXPIRY_GRACE_MS = 15000;
export const INSPECT_GRACE_MS = 5000;
export const REAP_INTERVAL_MS = 2000;

export interface SandboxOwnership {
  submissionId: string;
  attempt: number;
  leaseToken: string;
  workerId: string;
}

export interface SandboxSnapshot {
  running: boolean;
  finishedAtMs: number | null;
  expiresAtMs: number;
  leaseToken?: string;
}

export interface LeaseView {
  status: string;
  leaseToken?: string | null;
  leaseExpiresAtMs?: number | null;
}

export function decideSandbox(
  now: number,
  sandbox: SandboxSnapshot,
  lease: LeaseView | null,
): "keep" | "remove" {
  if (!Number.isFinite(sandbox.expiresAtMs)) return "keep";
  if (sandbox.running) {
    if (sandbox.expiresAtMs > now) return "keep";
    const owned =
      lease?.status === "running" &&
      Boolean(lease.leaseToken) &&
      lease.leaseToken === sandbox.leaseToken &&
      (lease.leaseExpiresAtMs ?? 0) > now;
    return owned ? "keep" : "remove";
  }
  const finished = sandbox.finishedAtMs ?? 0;
  if (
    finished > 0 &&
    now - finished < INSPECT_GRACE_MS &&
    sandbox.expiresAtMs > now
  )
    return "keep";
  return "remove";
}
