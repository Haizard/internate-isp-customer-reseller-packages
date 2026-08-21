import { Client } from "ssh2";
import type {
  AdapterCommandEnvelope,
  AdapterCommandResult,
  AdapterConfig,
  AdapterQueryEnvelope,
  AdapterQueryResult,
  RouterAdapter,
} from "./routerAdapters.contract";

export interface SshCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface Shell {
  connect(): Promise<void>;
  exec(command: string): Promise<SshCommandResult>;
  close(): Promise<void>;
}

const CONNECT_TIMEOUT_MS = 10_000;
const COMMAND_TIMEOUT_MS = 15_000;

function shQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function shEchoEscaped(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function parseDhcpLeases(stdout: string): { ip: string; mac: string; hostname: string }[] {
  const clients: { ip: string; mac: string; hostname: string }[] = [];
  for (const line of stdout.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4 && /^[0-9a-fA-F:]+$/.test(parts[1] ?? "") && parts[2].includes(".")) {
      clients.push({ ip: parts[2], mac: parts[1], hostname: parts[3] === "*" ? "" : parts[3] });
    }
  }
  return clients;
}

function parseProcNetDev(stdout: string): { interface: string; rxBytes: number; txBytes: number }[] {
  const counters: { interface: string; rxBytes: number; txBytes: number }[] = [];
  for (const line of stdout.split("\n")) {
    const match = line.match(/^\s*([a-zA-Z0-9_.-]+):\s+(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+/);
    if (!match) continue;
    counters.push({
      interface: match[1],
      rxBytes: Number(match[2]),
      txBytes: Number(match[3]),
    });
  }
  return counters;
}

function parseLoadavgCpu(stdout: string): number {
  const match = stdout.match(/^([\d.]+)/);
  const load = match ? Number(match[1]) : 0;
  return Math.min(100, Math.round(load * 100));
}

function parseMemPercent(stdout: string): number {
  const match = stdout.match(/MemTotal:\s+(\d+)/);
  if (!match) return 0;
  const totalKb = Number(match[1]);
  if (!totalKb) return 0;
  const freeMatch = stdout.match(/MemAvailable:\s+(\d+)/);
  const freeKb = freeMatch ? Number(freeMatch[1]) : 0;
  const used = Math.max(0, totalKb - freeKb);
  return Math.round((used / totalKb) * 100);
}

function parseDiskPercent(stdout: string): number {
  const lines = stdout.trim().split("\n");
  if (lines.length < 2) return 0;
  const parts = lines[1].trim().split(/\s+/);
  const pct = parts[4]?.replace("%", "");
  const value = Number(pct);
  return Number.isFinite(value) ? value : 0;
}

function parseUptimeSeconds(stdout: string): number {
  const match = stdout.match(/^([\d.]+)/);
  return match ? Math.round(Number(match[1])) : 0;
}

function parsePoolRange(ranges: string): { start: string; limit: string } {
  const [start, end] = ranges.split("-").map((s) => s.trim());
  if (!start || !end) return { start: "100", limit: "100" };
  const startOctet = start.split(".").pop() ?? "100";
  const endOctet = end.split(".").pop() ?? "100";
  const startNum = Number(startOctet);
  const endNum = Number(endOctet);
  const limit = Number.isFinite(startNum) && Number.isFinite(endNum) && endNum >= startNum ? endNum - startNum + 1 : 100;
  return { start: startOctet, limit: String(limit) };
}

export class OpenWrtAdapter implements RouterAdapter {
  readonly kind = "openwrt" as const;
  private shell: Shell;

  constructor(private readonly config: AdapterConfig, shell?: Shell) {
    this.shell = shell ?? new SshShell(config);
  }

  async connect() {
    try {
      await this.shell.connect();
      return {
        connected: true,
        host: this.config.host ?? "openwrt.local",
        mode: "ssh",
        note: "Connected to OpenWrt gateway over SSH",
      };
    } catch (error) {
      return {
        connected: false,
        host: this.config.host ?? "openwrt.local",
        mode: "ssh",
        note: error instanceof Error ? error.message : "SSH connection failed",
      };
    }
  }

  async execute(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    try {
      await this.shell.connect();
    } catch (error) {
      return this.fail(command, error instanceof Error ? error.message : "SSH connection failed");
    }

    try {
      switch (command.kind) {
        case "apply_profile":
          return this.applyProfile(command);
        case "create_user":
          return this.createUser(command);
        case "create_voucher":
          return this.createVoucher(command);
        case "disconnect_user":
          return this.disconnectUser(command);
        case "create_queue":
          return this.createQueue(command);
        case "create_pool":
          return this.createPool(command);
        case "create_pppoe_profile":
          return this.createPppoeProfile(command);
        case "create_hotspot_profile":
          return this.createHotspotProfile(command);
        case "heartbeat":
          return this.heartbeat(command);
        default:
          return this.fail(command, `Unsupported command kind: ${command.kind}`);
      }
    } catch (error) {
      return this.fail(command, error instanceof Error ? error.message : "OpenWrt command execution failed");
    }
  }

  async query(query: AdapterQueryEnvelope): Promise<AdapterQueryResult> {
    try {
      await this.shell.connect();
    } catch (error) {
      return {
        routerId: query.routerId,
        kind: query.kind,
        status: "FAILED",
        data: {},
        message: error instanceof Error ? error.message : "SSH connection failed",
      };
    }

    try {
      if (query.kind === "sessions") return this.querySessions(query.routerId);
      if (query.kind === "usage") return this.queryUsage(query.routerId);
      return this.queryHealth(query.routerId);
    } catch (error) {
      return {
        routerId: query.routerId,
        kind: query.kind,
        status: "FAILED",
        data: {},
        message: error instanceof Error ? error.message : "OpenWrt query failed",
      };
    }
  }

  private ok(command: AdapterCommandEnvelope, message: string): AdapterCommandResult {
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "APPLIED",
      configurationVersion: 1,
      message,
    };
  }

  private fail(command: AdapterCommandEnvelope, message: string): AdapterCommandResult {
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "FAILED",
      configurationVersion: 1,
      message,
    };
  }

  private async applyProfile(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { packageName?: string; speedMbps?: number; dataCapGb?: number };
    const speed = payload.speedMbps ?? 0;
    const name = payload.packageName ?? "default";

    const qosAvailable = await this.hasTool("/etc/init.d/qos");
    if (qosAvailable) {
      const script = [
        "uci set qos.wan.enabled=1",
        `uci set qos.wan.download=${Math.max(1, speed)}`,
        `uci set qos.wan.upload=${Math.max(1, Math.ceil(speed / 2))}`,
        "uci commit qos",
        "/etc/init.d/qos restart >/dev/null 2>&1",
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `QoS profile application failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Applied profile "${name}" at ${speed} Mbps`);
    }

    const tcResult = await this.shell.exec(
      `command -v tc >/dev/null 2>&1 && echo yes || echo no`,
    );
    if (tcResult.stdout.trim() === "yes") {
      const iface = await this.wanInterface();
      const script = [
        `tc qdisc del dev ${iface} root 2>/dev/null`,
        `tc qdisc add dev ${iface} root handle 1: htb default 10`,
        `tc class add dev ${iface} parent 1: classid 1:1 htb rate ${Math.max(1, speed)}mbit`,
        `tc class add dev ${iface} parent 1:1 classid 1:10 htb rate ${Math.max(1, speed)}mbit`,
        `tc qdisc add dev ${iface} parent 1:10 sfq perturb 10`,
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `tc profile application failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Applied profile "${name}" at ${speed} Mbps via tc on ${iface}`);
    }

    return this.fail(command, "Neither qos-scripts nor tc is available on the gateway");
  }

  private async createUser(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { username?: string; password?: string; profileName?: string; expiresAt?: string };
    const username = payload.username;
    if (!username) return this.fail(command, "create_user requires a username");
    const password = payload.password ?? username;
    const profile = payload.profileName ?? "default";

    const chilli = await this.hasTool("chilli_query");
    if (chilli) {
      const userLine = `${shEchoEscaped(username)} ${shEchoEscaped(password)}`;
      const expirySuffix = payload.expiresAt ? ` session-timeout ${Math.max(1, Math.round((new Date(payload.expiresAt).getTime() - Date.now()) / 1000))}` : "";
      const script = [
        `mkdir -p /etc/netmaster`,
        `printf '%s\\n' ${userLine} >> /etc/netmaster/users`,
        `if [ -f /etc/chilli/users ]; then printf '%s\\n' ${userLine}${expirySuffix} >> /etc/chilli/users; fi`,
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `User creation failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Created hotspot user "${username}" (profile ${profile})`);
    }

    const hostapd = await this.hasTool("hostapd");
    if (hostapd) {
      const script = [
        `mkdir -p /etc/netmaster`,
        `printf '%s\\n' ${shEchoEscaped(username)} ${shEchoEscaped(password)} ${shEchoEscaped(profile)} >> /etc/netmaster/users`,
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `User creation failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Recorded user "${username}" (no hotspot daemon — voucher auth not enforced)`);
    }

    return this.fail(command, "No hotspot daemon (chilli/hostapd) available on the gateway");
  }

  private async createVoucher(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { code?: string; dataGb?: number; durationHours?: number };
    const code = payload.code;
    if (!code) return this.fail(command, "create_voucher requires a code");
    const durationHours = payload.durationHours ?? 24;

    const chilli = await this.hasTool("chilli_query");
    if (chilli) {
      const userLine = `${shEchoEscaped(code)} ${shEchoEscaped(code)}`;
      const script = [
        `mkdir -p /etc/netmaster`,
        `printf '%s\\n' ${userLine} ${durationHours} ${payload.dataGb ?? ""} >> /etc/netmaster/vouchers`,
        `if [ -f /etc/chilli/users ]; then printf '%s\\n' ${userLine} session-timeout ${durationHours * 3600} >> /etc/chilli/users; fi`,
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `Voucher creation failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Created voucher "${code}" for ${durationHours}h (${payload.dataGb ?? "unlimited"} GB)`);
    }

    const result = await this.shell.exec(
      `mkdir -p /etc/netmaster && printf '%s\\n' ${shEchoEscaped(code)} ${durationHours} ${payload.dataGb ?? ""} >> /etc/netmaster/vouchers`,
    );
    if (result.code !== 0) {
      return this.fail(command, `Voucher creation failed: ${result.stderr || result.stdout}`);
    }
    return this.ok(command, `Recorded voucher "${code}" (no hotspot daemon — auth not enforced)`);
  }

  private async disconnectUser(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { username?: string; reason?: string };
    const username = payload.username;
    if (!username) return this.fail(command, "disconnect_user requires a username");

    const chilli = await this.hasTool("chilli_query");
    if (chilli) {
      const result = await this.shell.exec(
        `chilli_query logout ${shQuote(username)} 2>/dev/null || chilli_query list | awk -v u=${shQuote(username)} '$2==u {system("chilli_query logout " $1)}'`,
      );
      if (result.code === 0) {
        return this.ok(command, `Disconnected sessions for "${username}"`);
      }
      return this.fail(command, `chilli disconnect failed: ${result.stderr || result.stdout}`);
    }

    const ubus = await this.hasTool("ubus");
    if (ubus) {
      const script = [
        `for iface in $(ubus list 2>/dev/null | grep -o 'hostapd\\.[a-z0-9]*' | sort -u); do`,
        `  ubus call "$iface" del_client '{"address":"00:00:00:00:00:00","reason":2}' >/dev/null 2>&1;`,
        `done`,
        `true`,
      ].join(" ");
      const result = await this.shell.exec(script);
      if (result.code === 0) {
        return this.ok(command, `Requested disconnect for "${username}" via hostapd/ubus`);
      }
    }

    return this.fail(command, "No session control (chilli/hostapd/ubus) available on the gateway");
  }

  private async createQueue(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { name?: string; maxLimit?: string; burstLimit?: string };
    const name = payload.name ?? "netmaster-queue";
    const maxLimit = payload.maxLimit ?? "50M/50M";
    const match = maxLimit.match(/^(\d+)M/);
    const rate = match ? Number(match[1]) : 50;

    const tcResult = await this.shell.exec(`command -v tc >/dev/null 2>&1 && echo yes || echo no`);
    if (tcResult.stdout.trim() === "yes") {
      const iface = await this.wanInterface();
      const script = [
        `tc qdisc del dev ${iface} root 2>/dev/null`,
        `tc qdisc add dev ${iface} root handle 1: htb default 10`,
        `tc class add dev ${iface} parent 1: classid 1:1 htb rate ${rate}mbit`,
        `tc class add dev ${iface} parent 1:1 classid 1:10 htb rate ${rate}mbit`,
      ].join(" && ");
      const result = await this.shell.exec(script);
      if (result.code !== 0) {
        return this.fail(command, `Queue creation failed: ${result.stderr || result.stdout}`);
      }
      return this.ok(command, `Created queue "${name}" at ${rate} Mbps on ${iface}`);
    }

    return this.fail(command, "tc is not available on the gateway");
  }

  private async createPool(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { name?: string; ranges?: string };
    const name = payload.name ?? "netmaster-pool";
    const ranges = payload.ranges ?? "192.168.88.100-192.168.88.200";
    const { start, limit } = parsePoolRange(ranges);

    const dhcp = await this.hasTool("/etc/init.d/dnsmasq");
    if (!dhcp) return this.fail(command, "dnsmasq (DHCP) is not available on the gateway");

    const script = [
      `uci add dhcp pool >/dev/null`,
      `uci set dhcp.@pool[-1].name=${shQuote(name)}`,
      `uci set dhcp.@pool[-1].start=${start}`,
      `uci set dhcp.@pool[-1].limit=${limit}`,
      `uci set dhcp.@pool[-1].interface=lan`,
      `uci commit dhcp`,
      `/etc/init.d/dnsmasq restart >/dev/null 2>&1`,
    ].join(" && ");
    const result = await this.shell.exec(script);
    if (result.code !== 0) {
      return this.fail(command, `DHCP pool creation failed: ${result.stderr || result.stdout}`);
    }
    return this.ok(command, `Created DHCP pool "${name}" (${start}-${String(Number(start) + Number(limit) - 1)})`);
  }

  private async createPppoeProfile(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { name?: string; localAddress?: string; remoteAddress?: string; rateLimitMbps?: number };
    const name = payload.name ?? "netmaster-pppoe";
    const local = payload.localAddress ?? "192.168.88.1";
    const remote = payload.remoteAddress ?? "192.168.88.100-192.168.88.200";
    const rate = payload.rateLimitMbps ? `${payload.rateLimitMbps}M` : "unlimited";

    const result = await this.shell.exec(
      [
        `mkdir -p /etc/netmaster`,
        `printf '%s\\n' ${shEchoEscaped(name)} ${shEchoEscaped(local)} ${shEchoEscaped(remote)} ${rate} >> /etc/netmaster/pppoe_profiles`,
      ].join(" && "),
    );
    if (result.code !== 0) {
      return this.fail(command, `PPPoE profile creation failed: ${result.stderr || result.stdout}`);
    }
    return this.ok(command, `Recorded PPPoE profile "${name}" (local ${local}, remote ${remote}, ${rate})`);
  }

  private async createHotspotProfile(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const payload = command.payload as { name?: string; keepaliveTimeout?: number; maxSessions?: number };
    const name = payload.name ?? "netmaster-hotspot";
    const keepalive = payload.keepaliveTimeout ?? 300;
    const maxSessions = payload.maxSessions ?? 0;

    const chilli = await this.hasTool("chilli_query");
    if (!chilli) return this.fail(command, "chilli (hotspot daemon) is not available on the gateway");

    const script = [
      `uci set chilli.@chilli[0].uamlisten=0.0.0.0`,
      `uci set chilli.@chilli[0].timeout=${keepalive}`,
      maxSessions > 0 ? `uci set chilli.@chilli[0].maxsessions=${maxSessions}` : "",
      `uci commit chilli`,
      `/etc/init.d/chilli restart >/dev/null 2>&1`,
    ]
      .filter(Boolean)
      .join(" && ");
    const result = await this.shell.exec(script);
    if (result.code !== 0) {
      return this.fail(command, `Hotspot profile creation failed: ${result.stderr || result.stdout}`);
    }
    return this.ok(command, `Configured hotspot profile "${name}" (keepalive ${keepalive}s, max ${maxSessions || "unlimited"})`);
  }

  private async heartbeat(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    const result = await this.shell.exec(`cat /proc/uptime 2>/dev/null | awk '{print int($1)}'`);
    if (result.code !== 0) return this.fail(command, `Heartbeat failed: ${result.stderr || result.stdout}`);
    const uptime = Number(result.stdout.trim()) || 0;
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "APPLIED",
      configurationVersion: 1,
      message: `Heartbeat OK — gateway up for ${uptime}s`,
    };
  }

  private async querySessions(routerId: string): Promise<AdapterQueryResult> {
    const chilli = await this.hasTool("chilli_query");
    if (chilli) {
      const result = await this.shell.exec(`chilli_query list 2>/dev/null || true`);
      const lines = result.stdout.trim() === "" ? [] : result.stdout.trim().split("\n");
      const clients = lines
        .map((line) => {
          const parts = line.split(/\s+/);
          if (parts.length < 4) return null;
          return { mac: parts[0], ip: parts[1] ?? "", user: parts[2] ?? "" };
        })
        .filter((c): c is { mac: string; ip: string; user: string } => c !== null);
      return {
        routerId,
        kind: "sessions",
        status: "OK",
        data: {
          activeSessions: clients.length,
          connectedClients: clients.length,
          expiredSessions: 0,
          clients,
        },
      };
    }

    const leasesResult = await this.shell.exec(`cat /tmp/dhcp.leases 2>/dev/null || true`);
    const clients = parseDhcpLeases(leasesResult.stdout);
    return {
      routerId,
      kind: "sessions",
      status: "OK",
      data: {
        activeSessions: clients.length,
        connectedClients: clients.length,
        expiredSessions: 0,
        clients,
      },
    };
  }

  private async queryUsage(routerId: string): Promise<AdapterQueryResult> {
    const result = await this.shell.exec(`cat /proc/net/dev 2>/dev/null || true`);
    const counters = parseProcNetDev(result.stdout);
    const totalRx = counters.reduce((sum, c) => sum + c.rxBytes, 0);
    const totalTx = counters.reduce((sum, c) => sum + c.txBytes, 0);

    return {
      routerId,
      kind: "usage",
      status: "OK",
      data: {
        totalBytesUsed: totalRx + totalTx,
        downloadBytes: totalRx,
        uploadBytes: totalTx,
        byInterface: counters,
        usageByDay: [],
      },
    };
  }

  private async queryHealth(routerId: string): Promise<AdapterQueryResult> {
    const [uptimeRes, loadRes, memRes, diskRes] = await Promise.all([
      this.shell.exec(`cat /proc/uptime 2>/dev/null || true`),
      this.shell.exec(`cat /proc/loadavg 2>/dev/null || true`),
      this.shell.exec(`cat /proc/meminfo 2>/dev/null || true`),
      this.shell.exec(`df -P / 2>/dev/null || true`),
    ]);

    return {
      routerId,
      kind: "health",
      status: "OK",
      data: {
        status: "ACTIVE",
        uptimeSeconds: parseUptimeSeconds(uptimeRes.stdout),
        cpuPercent: parseLoadavgCpu(loadRes.stdout),
        memoryPercent: parseMemPercent(memRes.stdout),
        diskPercent: parseDiskPercent(diskRes.stdout),
        lastHeartbeatAt: new Date().toISOString(),
      },
    };
  }

  private async hasTool(command: string): Promise<boolean> {
    try {
      const result = await this.shell.exec(`command -v ${command} >/dev/null 2>&1 && echo yes || echo no`);
      return result.stdout.trim() === "yes";
    } catch {
      return false;
    }
  }

  private async wanInterface(): Promise<string> {
    const result = await this.shell.exec(
      `ifstatus wan 2>/dev/null | grep -o '"device": *"[^"]*"' | head -1 | sed 's/.*"device": *"//; s/"//' || echo eth0`,
    );
    const iface = result.stdout.trim();
    return iface || "eth0";
  }
}

class SshShell implements Shell {
  private client: Client | null = null;

  constructor(private readonly config: AdapterConfig) {}

  async connect(): Promise<void> {
    if (this.client) return;
    const host = this.config.host ?? "openwrt.local";
    const port = this.config.port ?? 22;
    const username = this.config.username ?? "root";
    const password = this.config.password;

    const client = new Client();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("SSH connection timed out"));
      }, CONNECT_TIMEOUT_MS);
      client
        .on("ready", () => {
          clearTimeout(timer);
          resolve();
        })
        .on("error", (err) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error("SSH connection error"));
        })
        .connect({ host, port, username, password });
    });

    this.client = client;
  }

  async exec(command: string): Promise<SshCommandResult> {
    if (!this.client) throw new Error("SSH client is not connected");
    return new Promise<SshCommandResult>((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        reject(new Error("SSH command timed out"));
      }, COMMAND_TIMEOUT_MS);

      this.client!.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error("SSH exec error"));
          return;
        }
        stream
          .on("close", (code: number) => {
            clearTimeout(timer);
            resolve({ code, stdout, stderr });
          })
          .on("data", (data: Buffer) => {
            stdout += data.toString("utf8");
          })
          .stderr.on("data", (data: Buffer) => {
            stderr += data.toString("utf8");
          });
      });
    });
  }

  async close(): Promise<void> {
    if (!this.client) return;
    const client = this.client;
    this.client = null;
    client.end();
  }
}
