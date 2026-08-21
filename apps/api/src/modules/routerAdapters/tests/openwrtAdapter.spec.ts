import { describe, expect, it } from "vitest";
import type { AdapterCommandEnvelope } from "../routerAdapters.contract";
import { OpenWrtAdapter, type SshCommandResult, type Shell } from "../openwrtAdapter";

function fakeShell(overrides: Partial<Record<string, SshCommandResult>> = {}) {
  const commands: string[] = [];
  const shell: Shell = {
    async connect() {},
    async exec(command: string) {
      commands.push(command);
      const override = overrides[command];
      if (override) return override;
      return { code: 0, stdout: "", stderr: "" };
    },
    async close() {},
  };
  return { shell, commands };
}

const adapter = (shell: Shell, config: Record<string, unknown> = {}) =>
  new OpenWrtAdapter(
    {
      adapterKind: "openwrt",
      connectionMode: "ssh",
      host: "192.168.1.1",
      port: 22,
      username: "root",
      pairingCode: "router-1",
      ...config,
    },
    shell,
  );

function envelope(kind: AdapterCommandEnvelope["kind"], payload: Record<string, unknown> = {}): AdapterCommandEnvelope {
  return {
    id: "cmd-1",
    routerId: "router-1",
    kind,
    payload,
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("OpenWrtAdapter.connect", () => {
  it("reports connected over SSH", async () => {
    const { shell } = fakeShell();
    const connection = await adapter(shell).connect();
    expect(connection.connected).toBe(true);
    expect(connection.mode).toBe("ssh");
  });

  it("reports failure when the shell cannot connect", async () => {
    const shell: Shell = {
      async connect() {
        throw new Error("ssh refused");
      },
      async exec() {
        return { code: 0, stdout: "", stderr: "" };
      },
      async close() {},
    };
    const connection = await adapter(shell).connect();
    expect(connection.connected).toBe(false);
    expect(connection.note).toContain("ssh refused");
  });
});

describe("OpenWrtAdapter.execute", () => {
  it("applies a package profile via qos-scripts when available", async () => {
    const { shell, commands } = fakeShell({
      "command -v /etc/init.d/qos >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
    });

    const result = await adapter(shell).execute(
      envelope("apply_profile", { packageName: "Fiber 50", speedMbps: 50, dataCapGb: 200 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(result.message).toContain("Fiber 50");
    expect(commands.some((c) => c.includes("uci set qos.wan.download=50"))).toBe(true);
    expect(commands.some((c) => c.includes("/etc/init.d/qos restart"))).toBe(true);
  });

  it("applies a profile via tc when qos-scripts is unavailable", async () => {
    const { shell, commands } = fakeShell({
      "command -v /etc/init.d/qos >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "no\n", stderr: "" },
      "command -v tc >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
      'ifstatus wan 2>/dev/null | grep -o \'"device": *"[^"]*"\' | head -1 | sed \'s/.*"device": *"//; s/"//\' || echo eth0': {
        code: 0,
        stdout: "eth1\n",
        stderr: "",
      },
    });

    const result = await adapter(shell).execute(
      envelope("apply_profile", { packageName: "Starter", speedMbps: 10 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(result.message).toContain("tc");
    expect(commands.some((c) => c.includes("tc class add dev eth1"))).toBe(true);
  });

  it("fails cleanly when no QoS mechanism exists", async () => {
    const { shell } = fakeShell({
      "command -v /etc/init.d/qos >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "no\n", stderr: "" },
      "command -v tc >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "no\n", stderr: "" },
    });

    const result = await adapter(shell).execute(envelope("apply_profile", { packageName: "X", speedMbps: 5 }));

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("Neither qos-scripts nor tc");
  });

  it("creates a hotspot user via chilli", async () => {
    const { shell, commands } = fakeShell({
      "command -v chilli_query >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
    });

    const result = await adapter(shell).execute(
      envelope("create_user", { username: "cust01", password: "secret", profileName: "fibre-50" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(result.message).toContain("cust01");
    const writeCmd = commands.find((c) => c.includes("/etc/netmaster/users"));
    expect(writeCmd).toBeDefined();
    expect(writeCmd).toContain("'cust01' 'secret'");
  });

  it("creates a voucher via chilli with a session timeout", async () => {
    const { shell, commands } = fakeShell({
      "command -v chilli_query >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
    });

    const result = await adapter(shell).execute(
      envelope("create_voucher", { code: "V123", dataGb: 20, durationHours: 24 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(result.message).toContain("V123");
    const chilliCmd = commands.find((c) => c.includes("/etc/chilli/users"));
    expect(chilliCmd).toContain("session-timeout 86400");
  });

  it("creates a DHCP pool via uci when dnsmasq is present", async () => {
    const { shell, commands } = fakeShell({
      "command -v /etc/init.d/dnsmasq >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
    });

    const result = await adapter(shell).execute(
      envelope("create_pool", { name: "pool-a", ranges: "192.168.88.100-192.168.88.150" }),
    );

    expect(result.status).toBe("APPLIED");
    expect(commands.some((c) => c.includes("uci add dhcp pool"))).toBe(true);
    expect(commands.some((c) => c.includes("uci set dhcp.@pool[-1].start=100"))).toBe(true);
    expect(commands.some((c) => c.includes("uci set dhcp.@pool[-1].limit=51"))).toBe(true);
  });

  it("fails creating a pool when dnsmasq is unavailable", async () => {
    const { shell } = fakeShell({
      "command -v /etc/init.d/dnsmasq >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "no\n", stderr: "" },
    });

    const result = await adapter(shell).execute(envelope("create_pool", { name: "p", ranges: "1.2.3.4-1.2.3.20" }));

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("dnsmasq");
  });

  it("configures a hotspot profile when chilli is present", async () => {
    const { shell, commands } = fakeShell({
      "command -v chilli_query >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
    });

    const result = await adapter(shell).execute(
      envelope("create_hotspot_profile", { name: "guest-net", keepaliveTimeout: 600, maxSessions: 25 }),
    );

    expect(result.status).toBe("APPLIED");
    expect(commands.some((c) => c.includes("uci set chilli.@chilli[0].timeout=600"))).toBe(true);
    expect(commands.some((c) => c.includes("uci set chilli.@chilli[0].maxsessions=25"))).toBe(true);
  });

  it("returns a failed result when the shell connection fails", async () => {
    const shell: Shell = {
      async connect() {
        throw new Error("unreachable");
      },
      async exec() {
        return { code: 0, stdout: "", stderr: "" };
      },
      async close() {},
    };

    const result = await adapter(shell).execute(envelope("create_queue", { name: "q1", maxLimit: "10M/10M" }));

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("unreachable");
  });
});

describe("OpenWrtAdapter.query", () => {
  it("returns chilli sessions when chilli_query is available", async () => {
    const { shell } = fakeShell({
      "command -v chilli_query >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "yes\n", stderr: "" },
      "chilli_query list 2>/dev/null || true": {
        code: 0,
        stdout: "00:11:22:33:44:55 192.168.88.10 12.3 1.2 400000 200000 60 1200000 600000 0\nAA:BB:CC:DD:EE:FF 192.168.88.11 12.3 1.2 400000 200000 60 1200000 600000 0\n",
        stderr: "",
      },
    });

    const result = await adapter(shell).query({ routerId: "router-1", kind: "sessions" });

    expect(result.status).toBe("OK");
    expect(result.data.activeSessions).toBe(2);
    const clients = result.data.clients as { mac: string }[];
    expect(clients[0].mac).toBe("00:11:22:33:44:55");
  });

  it("falls back to dhcp leases when chilli is unavailable", async () => {
    const { shell } = fakeShell({
      "command -v chilli_query >/dev/null 2>&1 && echo yes || echo no": { code: 0, stdout: "no\n", stderr: "" },
      "cat /tmp/dhcp.leases 2>/dev/null || true": {
        code: 0,
        stdout: "1722456000 00:11:22:33:44:55 192.168.88.10 phone *\n1722456000 AA:BB:CC:DD:EE:FF 192.168.88.11 laptop *\n",
        stderr: "",
      },
    });

    const result = await adapter(shell).query({ routerId: "router-1", kind: "sessions" });

    expect(result.status).toBe("OK");
    expect(result.data.activeSessions).toBe(2);
    const clients = result.data.clients as { hostname: string }[];
    expect(clients[1].hostname).toBe("laptop");
  });

  it("returns interface usage from /proc/net/dev", async () => {
    const { shell } = fakeShell({
      "cat /proc/net/dev 2>/dev/null || true": {
        code: 0,
        stdout: "Inter-|   Receive                                                |  Transmit\n face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n  eth0: 1000 1 0 0 0 0 0 0  2000 1 0 0 0 0 0 0\n",
        stderr: "",
      },
    });

    const result = await adapter(shell).query({ routerId: "router-1", kind: "usage" });

    expect(result.status).toBe("OK");
    expect(result.data.totalBytesUsed).toBe(3000);
    expect(result.data.downloadBytes).toBe(1000);
    expect(result.data.uploadBytes).toBe(2000);
  });

  it("reports gateway health from /proc files", async () => {
    const { shell } = fakeShell({
      "cat /proc/uptime 2>/dev/null || true": { code: 0, stdout: "2592000.00 9000000.00\n", stderr: "" },
      "cat /proc/loadavg 2>/dev/null || true": { code: 0, stdout: "0.42 0.30 0.20 1/120 4321\n", stderr: "" },
      "cat /proc/meminfo 2>/dev/null || true": {
        code: 0,
        stdout: "MemTotal:       131072 kB\nMemFree:         32768 kB\nMemAvailable:    65536 kB\n",
        stderr: "",
      },
      "df -P / 2>/dev/null || true": { code: 0, stdout: "Filesystem     1K-blocks  Used Available Use% Mounted on\n/dev/root          65536  9830  55706  15% /\n", stderr: "" },
    });

    const result = await adapter(shell).query({ routerId: "router-1", kind: "health" });

    expect(result.status).toBe("OK");
    expect(result.data.uptimeSeconds).toBe(2592000);
    expect(result.data.cpuPercent).toBe(42);
    expect(result.data.memoryPercent).toBe(50);
    expect(result.data.diskPercent).toBe(15);
  });

  it("returns a failed query when the shell cannot connect", async () => {
    const shell: Shell = {
      async connect() {
        throw new Error("no route");
      },
      async exec() {
        return { code: 0, stdout: "", stderr: "" };
      },
      async close() {},
    };

    const result = await adapter(shell).query({ routerId: "router-1", kind: "health" });

    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("no route");
  });
});
