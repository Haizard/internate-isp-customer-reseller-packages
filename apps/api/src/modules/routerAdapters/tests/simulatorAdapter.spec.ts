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

  it("fails sessions read when simulating an offline gateway", async () => {
    const offlineAdapter = new SimulatorAdapter({
      adapterKind: "simulator",
      connectionMode: "simulator",
      pairingCode: "router-1",
      simulateOffline: true,
    });

    const connection = await offlineAdapter.connect();
    const result = await offlineAdapter.query({ routerId: "router-1", kind: "sessions" });

    expect(connection.connected).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("offline");
  });

  it("fails command execution when simulating an offline gateway", async () => {
    const offlineAdapter = new SimulatorAdapter({
      adapterKind: "simulator",
      connectionMode: "simulator",
      pairingCode: "router-1",
      simulateOffline: true,
    });

    const result = await offlineAdapter.execute({
      id: "cmd-1",
      routerId: "router-1",
      kind: "create_queue",
      payload: { name: "q-1" },
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("offline");
  });

  it("reports expired sessions when simulating expiry", async () => {
    const expiryAdapter = new SimulatorAdapter({
      adapterKind: "simulator",
      connectionMode: "simulator",
      pairingCode: "router-1",
      simulateExpiry: true,
    });

    const result = await expiryAdapter.query({ routerId: "router-1", kind: "sessions" });

    expect(result.status).toBe("OK");
    expect(result.data.expiredSessions).toBe(1);
    const clients = result.data.clients as { expired?: boolean }[];
    expect(clients.some((client) => client.expired === true)).toBe(true);
  });
});
