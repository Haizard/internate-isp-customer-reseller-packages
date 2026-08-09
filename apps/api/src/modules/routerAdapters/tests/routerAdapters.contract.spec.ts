import { describe, expect, it } from "vitest";
import type { AdapterCommandEnvelope } from "../routerAdapters.contract";

describe("router adapter contract", () => {
  it("describes a queueable command envelope for future RouterOS adapters", () => {
    const command: AdapterCommandEnvelope = {
      id: "cmd-1",
      routerId: "router-1",
      kind: "apply_profile",
      payload: { packageName: "Fiber 50" },
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    expect(command.kind).toBe("apply_profile");
    expect(command.status).toBe("PENDING");
  });

  it("supports additional RouterOS command types", () => {
    const queueCommand: AdapterCommandEnvelope = {
      id: "cmd-2",
      routerId: "router-1",
      kind: "create_queue",
      payload: { name: "queue-1", maxLimit: "10M/10M" },
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    expect(queueCommand.kind).toBe("create_queue");
  });
});
