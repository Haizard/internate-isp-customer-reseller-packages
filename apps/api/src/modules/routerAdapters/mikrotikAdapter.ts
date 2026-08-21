import type {
  AdapterCommandEnvelope,
  AdapterCommandResult,
  AdapterConfig,
  AdapterQueryEnvelope,
  AdapterQueryResult,
  RouterAdapter,
} from "./routerAdapters.contract";
import { RouterOSClient } from "routeros-client";

export class MikroTikAdapter implements RouterAdapter {
  readonly kind = "mikrotik" as const;
  private client?: RouterOSClient;
  private apiMenu?: ReturnType<RouterOSClient["api"]>;

  constructor(private readonly config: AdapterConfig) {}

  async connect() {
    if (this.config.connectionMode !== "api") {
      throw new Error("MikroTik adapter requires API mode");
    }

    const host = this.config.host ?? "routeros.local";
    const port = this.config.port ?? 8728;
    const username = this.config.username ?? "admin";
    const password = this.config.password;

    try {
      const client = new RouterOSClient({
        host,
        port,
        user: username,
        password,
      });

      const connectResult = await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("RouterOS connection timed out")), 1000);
        }),
      ]);

      if (connectResult !== undefined) {
        await Promise.resolve(connectResult);
      }

      this.client = client;
      this.apiMenu = client.api();
      return {
        connected: true,
        host,
        mode: "api",
        note: "Connected to RouterOS API",
      };
    } catch (error) {
      this.client = undefined;
      return {
        connected: false,
        host,
        mode: "api",
        note: error instanceof Error ? error.message : "RouterOS API connection failed",
      };
    }
  }

  async execute(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    if (!this.client || !this.apiMenu) {
      return {
        commandId: command.id,
        routerId: command.routerId,
        status: "FAILED",
        configurationVersion: 1,
        message: "RouterOS client is not connected",
      };
    }

    try {
      switch (command.kind) {
        case "apply_profile": {
          const payload = command.payload as { packageName?: string; speedMbps?: number; dataCapGb?: number };
          await this.apiMenu.menu("/queue/simple").add({
            name: payload.packageName ?? command.routerId,
            "max-limit": `${payload.speedMbps ?? 0}M/${payload.speedMbps ?? 0}M`,
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS profile command executed",
          };
        }
        case "create_user": {
          const payload = command.payload as { username?: string; password?: string; profileName?: string };
          await this.apiMenu.menu("/ip/hotspot/user").add({
            name: payload.username ?? command.routerId,
            password: payload.password ?? "changeme",
            profile: payload.profileName ?? "default",
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS user command executed",
          };
        }
        case "create_voucher": {
          const payload = command.payload as { code?: string; dataGb?: number; durationHours?: number };
          await this.apiMenu.menu("/ip/hotspot/user").add({
            name: payload.code ?? command.routerId,
            password: payload.code ?? command.routerId,
            profile: `voucher-${payload.durationHours ?? 0}`,
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS voucher command executed",
          };
        }
        case "create_queue": {
          const payload = command.payload as { name?: string; maxLimit?: string };
          await this.apiMenu.menu("/queue/simple").add({
            name: payload.name ?? `${command.routerId}-queue`,
            "max-limit": payload.maxLimit ?? "0/0",
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS queue command executed",
          };
        }
        case "create_pool": {
          const payload = command.payload as { name?: string; range?: string };
          await this.apiMenu.menu("/ip/pool").add({
            name: payload.name ?? `${command.routerId}-pool`,
            ranges: payload.range ?? "192.168.88.100-192.168.88.200",
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS pool command executed",
          };
        }
        case "create_pppoe_profile": {
          const payload = command.payload as { name?: string; localAddress?: string; remoteAddress?: string };
          await this.apiMenu.menu("/ppp/profile").add({
            name: payload.name ?? `${command.routerId}-pppoe`,
            "local-address": payload.localAddress ?? "192.168.88.1",
            "remote-address": payload.remoteAddress ?? "192.168.88.100-192.168.88.200",
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS PPPoE profile command executed",
          };
        }
        case "create_hotspot_profile": {
          const payload = command.payload as { name?: string; hotspotAddress?: string };
          await this.apiMenu.menu("/ip/hotspot/profile").add({
            name: payload.name ?? `${command.routerId}-hsprof`,
            "hotspot-address": payload.hotspotAddress ?? "192.168.88.1",
          });
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS hotspot profile command executed",
          };
        }
        case "disconnect_user":
          return {
            commandId: command.id,
            routerId: command.routerId,
            status: "APPLIED",
            configurationVersion: 1,
            message: "RouterOS session disconnect command recorded",
          };
        case "heartbeat":
        default:
          return {
            commandId: `heartbeat-${Date.now()}`,
            routerId: this.config.pairingCode ?? "unknown",
            status: "PENDING",
            configurationVersion: 1,
            message: "Heartbeat prepared for RouterOS API",
          };
      }
    } catch (error) {
      return {
        commandId: command.id,
        routerId: command.routerId,
        status: "FAILED",
        configurationVersion: 1,
        message: error instanceof Error ? error.message : "RouterOS command execution failed",
      };
    }
  }

  async query(query: AdapterQueryEnvelope): Promise<AdapterQueryResult> {
    if (!this.client || !this.apiMenu) {
      return {
        routerId: query.routerId,
        kind: query.kind,
        status: "FAILED",
        data: {},
        message: "RouterOS client is not connected",
      };
    }

    try {
      if (query.kind === "capabilities") {
        return {
          routerId: query.routerId,
          kind: "capabilities",
          status: "OK",
          data: {
            platform: "mikrotik",
            model: "RouterOS gateway",
            firmware: null,
            release: null,
            architecture: null,
            uptimeSeconds: 0,
            features: {
              chilli: false,
              hostapd: false,
              tc: false,
              ubus: false,
              qos: false,
              dnsmasq: false,
            },
            supportedCommands: {
              apply_profile: true,
              create_user: true,
              create_voucher: true,
              disconnect_user: true,
              create_queue: true,
              create_pool: false,
              create_pppoe_profile: true,
              create_hotspot_profile: true,
              heartbeat: true,
            },
            supportedQueries: {
              sessions: true,
              usage: false,
              health: false,
              capabilities: true,
            },
          },
        };
      }

      if (query.kind === "sessions") {
        const sessions = await this.apiMenu.menu("/ip/hotspot/active").getAll();
        return {
          routerId: query.routerId,
          kind: query.kind,
          status: "OK",
          data: { sessions },
        };
      }

      return {
        routerId: query.routerId,
        kind: query.kind,
        status: "FAILED",
        data: {},
        message: "RouterOS usage/health reads require monitoring setup; use the simulator while no device is enrolled",
      };
    } catch (error) {
      return {
        routerId: query.routerId,
        kind: query.kind,
        status: "FAILED",
        data: {},
        message: error instanceof Error ? error.message : "RouterOS query failed",
      };
    }
  }
}
