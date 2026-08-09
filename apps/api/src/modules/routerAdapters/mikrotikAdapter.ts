import type { AdapterCommandEnvelope, AdapterCommandResult, AdapterConfig } from "./routerAdapters.contract";

export class MikroTikAdapter {
  constructor(private readonly config: AdapterConfig) {}

  async connect() {
    if (this.config.connectionMode !== "api") {
      throw new Error("MikroTik adapter requires API mode");
    }

    return {
      connected: true,
      host: this.config.host ?? "routeros.local",
      mode: "api",
      note: "Prepared for RouterOS API connection; hardware validation is deferred.",
    };
  }

  async applyProfile(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "PENDING",
      configurationVersion: 1,
      message: "Queued for RouterOS API execution",
    };
  }

  async createUser(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "PENDING",
      configurationVersion: 1,
      message: "Queued for RouterOS user creation",
    };
  }

  async disconnectUser(command: AdapterCommandEnvelope): Promise<AdapterCommandResult> {
    return {
      commandId: command.id,
      routerId: command.routerId,
      status: "PENDING",
      configurationVersion: 1,
      message: "Queued for RouterOS session disconnect",
    };
  }

  async heartbeat(): Promise<AdapterCommandResult> {
    return {
      commandId: `heartbeat-${Date.now()}`,
      routerId: this.config.pairingCode ?? "unknown",
      status: "PENDING",
      configurationVersion: 1,
      message: "Heartbeat prepared for RouterOS API",
    };
  }
}
