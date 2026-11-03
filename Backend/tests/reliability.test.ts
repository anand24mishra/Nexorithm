import { describe, expect, it } from "vitest";
import { assessReadiness } from "../src/health";
import { crashAfterExecutionEnabled } from "../src/queue/faults";
import {
  decideSandbox,
  INSPECT_GRACE_MS,
} from "../src/services/sandboxLifecycle";

const now = 1_000_000;
describe("sandbox ownership decisions", () => {
  it("keeps a running container inside its deadline", () =>
    expect(
      decideSandbox(
        now,
        { running: true, finishedAtMs: null, expiresAtMs: now + 1 },
        null,
      ),
    ).toBe("keep"));
  it("keeps a past-deadline container while its lease is still valid", () =>
    expect(
      decideSandbox(
        now,
        {
          running: true,
          finishedAtMs: null,
          expiresAtMs: now - 1,
          leaseToken: "lease",
        },
        { status: "running", leaseToken: "lease", leaseExpiresAtMs: now + 1 },
      ),
    ).toBe("keep"));
  it("removes a past-deadline container whose lease has expired", () =>
    expect(
      decideSandbox(
        now,
        {
          running: true,
          finishedAtMs: null,
          expiresAtMs: now - 1,
          leaseToken: "lease",
        },
        { status: "running", leaseToken: "lease", leaseExpiresAtMs: now - 1 },
      ),
    ).toBe("remove"));
  it("keeps an exited container during the inspect grace", () =>
    expect(
      decideSandbox(
        now,
        {
          running: false,
          finishedAtMs: now - INSPECT_GRACE_MS + 1,
          expiresAtMs: now + 1000,
        },
        null,
      ),
    ).toBe("keep"));
  it("removes an exited container after the inspect grace", () =>
    expect(
      decideSandbox(
        now,
        {
          running: false,
          finishedAtMs: now - INSPECT_GRACE_MS - 1,
          expiresAtMs: now + 1000,
        },
        null,
      ),
    ).toBe("remove"));
  it("does not remove a container with no deadline", () =>
    expect(
      decideSandbox(
        now,
        { running: true, finishedAtMs: null, expiresAtMs: Number.NaN },
        null,
      ),
    ).toBe("keep"));
});

describe("readiness", () => {
  it("stays live-independent and names the failed dependency", async () => {
    const started = Date.now();
    const report = await assessReadiness({
      closing: false,
      mongo: () => new Promise(() => undefined),
      redis: async () => "ok",
    });
    expect(report).toEqual({
      status: "unavailable",
      dependencies: ["mongodb"],
    });
    expect(Date.now() - started).toBeGreaterThanOrEqual(1900);
    expect(Date.now() - started).toBeLessThan(4000);
  });
  it("reports both dependencies while both checks hang", async () => {
    const report = await assessReadiness({
      closing: false,
      mongo: () => new Promise(() => undefined),
      redis: () => new Promise(() => undefined),
    });
    expect(report).toEqual({
      status: "unavailable",
      dependencies: ["mongodb", "redis"],
    });
  });
  it("recovers when both checks succeed", async () =>
    expect(
      assessReadiness({
        closing: false,
        mongo: async () => 1,
        redis: async () => 1,
      }),
    ).resolves.toEqual({ status: "ready" }));
});

describe("post-execution fault switch", () => {
  const previous = {
    node: process.env.NODE_ENV,
    fault: process.env.FAULT_AFTER_EXECUTION,
  };
  it("is disabled in production and unless explicitly armed", () => {
    process.env.NODE_ENV = "production";
    process.env.FAULT_AFTER_EXECUTION = "crash";
    expect(crashAfterExecutionEnabled()).toBe(false);
    process.env.NODE_ENV = "development";
    delete process.env.FAULT_AFTER_EXECUTION;
    expect(crashAfterExecutionEnabled()).toBe(false);
    process.env.FAULT_AFTER_EXECUTION = "crash";
    expect(crashAfterExecutionEnabled()).toBe(true);
    if (previous.node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.node;
    if (previous.fault === undefined) delete process.env.FAULT_AFTER_EXECUTION;
    else process.env.FAULT_AFTER_EXECUTION = previous.fault;
  });
});
