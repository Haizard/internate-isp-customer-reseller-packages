import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({
  recorded: [] as Array<{ path: string; data: Record<string, unknown> }>,
  shouldFail: false,
}));

vi.mock("routeros-client", () => {
  const menu = (path: string) => ({
    add: (data: Record<string, unknown>) => {
      calls.recorded.push({ path, data });
      if (calls.shouldFail) {
        return Promise.reject(new Error("RouterOS denied the request"));
      }
      return Promise.resolve([{ ret: [{}] }]);
    },
  });

  const api = { menu };

  class RouterOSClientMock {
    constructor(public options: unknown) {}

    connect() {
      return Promise.resolve(api);
    }

    api() {
      return api;
    }
  }

  return { RouterOSClient: RouterOSClientMock };
});

import { MikroTikAdapter } from "../mikrotikAdapter";
import type { AdapterCommandEnvelope } from "../routerAdapters.contract";

const buildAdapter = () =>
  new MikroTikAdapter({
    adapterKind: "mikrotik",
    connectionMode: "api",
    host: "192.168.88.1",
    port: 8728,
    username: "admin",
    password: "secret",
    pairingCode: "pair-123",
  });

const envelope = (kind: AdapterCommandEnvelope["kind"], payload: Record<string, unknown>): AdapterCommandEnvelope => ({
  id: `cmd-${kind}`,
  routerId: "router-1",
  kind,
  payload,
  status: "PENDING",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  calls.recorded.length = 0;
  calls.shouldFail = false;
});

describe("MikroTikAdapter command execution", () => {
  it("connects successfully against a reachable RouterOS API", async () => {
    const adapter = buildAdapter();
    const connection = await adapter.connect();

    expect(connection.connected).toBe(true);
    expect(connection.mode).toBe("api");
  });

  it("rejects non-API connection modes", async () => {
    const adapter = new MikroTikAdapter({
      adapterKind: "mikrotik",
      connectionMode: "simulator",
    });

    await expect(adapter.connect()).rejects.toThrow("requires API mode");
  });

  it("applies a profile to /queue/simple with a max-limit", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("apply_profile", { packageName: "Fiber 50", speedMbps: 50, dataCapGb: 1000 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      { path: "/queue/simple", data: { name: "Fiber 50", "max-limit": "50M/50M" } },
    ]);
  });

  it("creates a hotspot user", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_user", { username: "cust01", password: "p4ss", profileName: "pppoe-10m" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      {
        path: "/ip/hotspot/user",
        data: { name: "cust01", password: "p4ss", profile: "pppoe-10m" },
      },
    ]);
  });

  it("creates a voucher with a duration-based profile", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_voucher", { code: "VC-1234", dataGb: 10, durationHours: 24 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      {
        path: "/ip/hotspot/user",
        data: { name: "VC-1234", password: "VC-1234", profile: "voucher-24" },
      },
    ]);
  });

  it("creates a queue with a custom max-limit", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_queue", { name: "q-home", maxLimit: "20M/20M" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      { path: "/queue/simple", data: { name: "q-home", "max-limit": "20M/20M" } },
    ]);
  });

  it("creates an address pool", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_pool", { name: "pool-a", range: "192.168.1.10-192.168.1.50" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      {
        path: "/ip/pool",
        data: { name: "pool-a", ranges: "192.168.1.10-192.168.1.50" },
      },
    ]);
  });

  it("creates a PPPoE profile", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_pppoe_profile", { name: "ppp-10m", localAddress: "192.168.88.1" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      {
        path: "/ppp/profile",
        data: { name: "ppp-10m", "local-address": "192.168.88.1", "remote-address": "192.168.88.100-192.168.88.200" },
      },
    ]);
  });

  it("creates a hotspot profile", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(
      envelope("create_hotspot_profile", { name: "hs-home", hotspotAddress: "10.0.0.1" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toEqual([
      {
        path: "/ip/hotspot/profile",
        data: { name: "hs-home", "hotspot-address": "10.0.0.1" },
      },
    ]);
  });

  it("records disconnect_user without issuing an API call", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(envelope("disconnect_user", {}));

    expect(result.status).toBe("APPLIED");
    expect(calls.recorded).toHaveLength(0);
  });

  it("returns a pending heartbeat without issuing an API call", async () => {
    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(envelope("heartbeat", {}));

    expect(result.status).toBe("PENDING");
    expect(calls.recorded).toHaveLength(0);
  });

  it("reports a failed execution result when the client is not connected", async () => {
    const adapter = buildAdapter();

    const result = await adapter.execute(envelope("create_queue", { name: "q-home" }));

    expect(result.status).toBe("FAILED");
    expect(calls.recorded).toHaveLength(0);
  });

  it("reports a failed execution result when the API call throws", async () => {
    calls.shouldFail = true;

    const adapter = buildAdapter();
    await adapter.connect();

    const result = await adapter.execute(envelope("create_queue", { name: "q-home" }));

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("RouterOS denied the request");
  });
});
