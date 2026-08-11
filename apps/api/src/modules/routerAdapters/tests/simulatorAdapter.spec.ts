import { describe, expect, it } from "vitest";
import { SimulatorAdapter } from "../simulatorAdapter";

const adapter = () =>
  new SimulatorAdapter({
    adapterKind: "simulator",
    connectionMode: "simulator",
    pairingCode: "router-1",
  });

describe("SimulatorAdapter.query", () => {
  it("returns sample active sessions for the sessions query", async () => {
    const result = await adapter().query({ routerId: "router-1", kind: "sessions" });

    expect(result.status).toBe("OK");
    expect(result.kind).toBe("sessions");
    const sessions = result.data.activeSessions as number;
    const clients = result.data.clients as unknown[];
    expect(sessions).toBe(3);
    expect(clients).toHaveLength(3);
  });

  it("returns a per-day usage breakdown for the usage query", async () => {
    const result = await adapter().query({ routerId: "router-1", kind: "usage" });

    expect(result.status).toBe("OK");
    const usageByDay = result.data.usageByDay as { day: string; bytesUsed: number }[];
    expect(usageByDay.length).toBeGreaterThan(0);
    expect(usageByDay[0]).toHaveProperty("day");
    expect(usageByDay[0]).toHaveProperty("bytesUsed");
  });

  it("returns system health for the health query", async () => {
    const result = await adapter().query({ routerId: "router-1", kind: "health" });

    expect(result.status).toBe("OK");
    expect(result.data.cpuPercent).toBeDefined();
    expect(result.data.memoryPercent).toBeDefined();
    expect(result.data.status).toBe("ACTIVE");
  });
});
