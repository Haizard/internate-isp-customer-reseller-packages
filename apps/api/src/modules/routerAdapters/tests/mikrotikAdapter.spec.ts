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

    expect(connection.connected).toBe(true);
    expect(connection.host).toBe("192.168.88.1");
  });
});
