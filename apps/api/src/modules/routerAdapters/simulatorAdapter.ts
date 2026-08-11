import type {
  AdapterCommandEnvelope,
  AdapterCommandResult,
  AdapterConfig,
  AdapterQueryEnvelope,
  AdapterQueryResult,
  RouterAdapter,
} from "./routerAdapters.contract";

const SAMPLE_CLIENTS = [
  { name: "John Mushi", mac: "A4:2B:B0:11:22:33", ip: "192.168.88.10", uptimeSeconds: 84300, downloadBytes: 1258291200, uploadBytes: 251658240 },
  { name: "Neema Hassan", mac: "A4:2B:B0:44:55:66", ip: "192.168.88.11", uptimeSeconds: 43200, downloadBytes: 734003200, uploadBytes: 104857600 },
  { name: "Guest", mac: "A4:2B:B0:77:88:99", ip: "192.168.88.12", uptimeSeconds: 1200, downloadBytes: 104857600, uploadBytes: 20971520 },
];

export class SimulatorAdapter implements RouterAdapter {
  readonly kind = "simulator" as const;

  constructor(private readonly config: AdapterConfig) {}

  async connect() {
    return {
      connected: true,
      host: this.config.host ?? "simulator.local",
      mode: "simulator",
      note: "Prepared for simulator execution; hardware validation is deferred.",
    };
  }

  async execute(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    switch (command.kind) {
      case "apply_profile":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated profile application completed",
        };
      case "create_user":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated user creation completed",
        };
      case "create_voucher":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated voucher creation completed",
        };
      case "disconnect_user":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated session disconnect completed",
        };
      case "create_queue":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated queue creation completed",
        };
      case "create_pool":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated pool creation completed",
        };
      case "create_pppoe_profile":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated PPPoE profile creation completed",
        };
      case "create_hotspot_profile":
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated hotspot profile creation completed",
        };
      case "heartbeat":
      default:
        return {
          commandId: command.id,
          routerId: command.routerId,
          status: "APPLIED",
          configurationVersion: 1,
          message: "Simulated heartbeat completed",
        };
    }
  }

  async query(query: AdapterQueryEnvelope): Promise<AdapterQueryResult> {
    switch (query.kind) {
      case "sessions":
        return {
          routerId: query.routerId,
          kind: "sessions",
          status: "OK",
          data: {
            activeSessions: SAMPLE_CLIENTS.length,
            connectedClients: SAMPLE_CLIENTS.length,
            clients: SAMPLE_CLIENTS,
          },
        };
      case "usage":
        return {
          routerId: query.routerId,
          kind: "usage",
          status: "OK",
          data: {
            totalBytesUsed: 2097152000,
            usageByDay: [
              { day: "2026-08-05", bytesUsed: 262144000 },
              { day: "2026-08-06", bytesUsed: 419430400 },
              { day: "2026-08-07", bytesUsed: 314572800 },
              { day: "2026-08-08", bytesUsed: 524288000 },
              { day: "2026-08-09", bytesUsed: 367001600 },
              { day: "2026-08-10", bytesUsed: 209715200 },
            ],
          },
        };
      case "health":
      default:
        return {
          routerId: query.routerId,
          kind: "health",
          status: "OK",
          data: {
            status: "ACTIVE",
            uptimeSeconds: 2592000,
            cpuPercent: 23,
            memoryPercent: 41,
            diskPercent: 17,
            temperatureC: 48,
            lastHeartbeatAt: new Date().toISOString(),
          },
        };
    }
  }
}
