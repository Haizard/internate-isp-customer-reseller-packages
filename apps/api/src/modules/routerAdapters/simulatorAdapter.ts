import type { AdapterCommandEnvelope, AdapterCommandResult, AdapterConfig, RouterAdapter } from "./routerAdapters.contract";

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
}
