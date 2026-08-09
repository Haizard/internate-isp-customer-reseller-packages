import { describe, expect, it } from "vitest";
import { MikroTikAdapter } from "../mikrotikAdapter";

describe("MikroTikAdapter", () => {
  it("connects in API mode and reports a prepared RouterOS path", async () => {
    const adapter = new MikroTikAdapter({
      adapterKind: "mikrotik",
      connectionMode: "api",
      host: "192.168.88.1",
      port: 8728,
      username: "admin",
      pairingCode: "pair-123",
    });

    const connection = await adapter.connect();

    expect(connection.connected).toBe(false);
    expect(connection.host).toBe("192.168.88.1");
    expect(connection.note).toBeDefined();
  });

  it("returns a failed execution result when the client is not connected", async () => {
    const adapter = new MikroTikAdapter({
      adapterKind: "mikrotik",
      connectionMode: "api",
      host: "192.168.88.1",
      port: 8728,
      username: "admin",
      pairingCode: "pair-123",
    });

    const result = await adapter.execute({
      id: "cmd-3",
      routerId: "router-1",
      kind: "create_queue",
      payload: { name: "queue-1" },
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result.status).toBe("FAILED");
  });
});
