import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { ApplyProfileInput, CreateRouterUserInput, CreateVoucherInput, EnrollRouterInput } from "./routerAdapters.dto";
import type { RouterAdapterCommandResult, RouterAdapterStatus } from "./routerAdapters.types";
import type { AdapterCommandEnvelope, AdapterConfig, RouterAdapter } from "./routerAdapters.contract";
import type { RouterAdapterLifecycleState } from "./routerAdapters.lifecycle";
import { MikroTikAdapter } from "./mikrotikAdapter";
import { SimulatorAdapter } from "./simulatorAdapter";

export class RouterAdaptersService {
  private buildAdapterConfig(input: EnrollRouterInput): AdapterConfig {
    const adapterKind = input.adapterType;
    const config: AdapterConfig = {
      adapterKind,
      connectionMode: adapterKind === "mikrotik" ? "api" : "simulator",
      pairingCode: input.pairingCode,
    };

    if (process.env.ROUTER_ADAPTER_HOST) {
      config.host = process.env.ROUTER_ADAPTER_HOST;
    }
    if (process.env.ROUTER_ADAPTER_PORT) {
      config.port = Number(process.env.ROUTER_ADAPTER_PORT);
    }
    if (process.env.ROUTER_ADAPTER_USERNAME) {
      config.username = process.env.ROUTER_ADAPTER_USERNAME;
    }
    if (process.env.ROUTER_ADAPTER_PASSWORD) {
      config.password = process.env.ROUTER_ADAPTER_PASSWORD;
    }

    return config;
  }

  private buildCommandEnvelope(routerId: string, kind: AdapterCommandEnvelope["kind"], payload: Record<string, unknown>): AdapterCommandEnvelope {
    const now = new Date().toISOString();
    return {
      id: `${routerId}-${kind}-${Date.now()}`,
      routerId,
      kind,
      payload,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
  }

  private async persistCommand(command: AdapterCommandEnvelope) {
    const commandClient = (prisma as any).routerAdapterCommand;
    if (!commandClient?.create) {
      return;
    }

    try {
      await commandClient.create({
        data: {
          id: command.id,
          routerId: command.routerId,
          kind: command.kind,
          payload: command.payload,
          status: command.status,
          createdAt: command.createdAt,
          updatedAt: command.updatedAt,
        },
      });
    } catch (error) {
      console.warn("Unable to persist router adapter command", error);
    }
  }

  private async executeAdapterCommand(command: AdapterCommandEnvelope, adapterKind: "simulator" | "mikrotik", config?: AdapterConfig) {
    const adapterConfig = config ?? {
      adapterKind,
      connectionMode: adapterKind === "mikrotik" ? "api" : "simulator",
      pairingCode: command.routerId,
    };

    const adapter: RouterAdapter = adapterKind === "mikrotik"
      ? new MikroTikAdapter(adapterConfig)
      : new SimulatorAdapter(adapterConfig);

    await adapter.connect();
    const executionResult = await adapter.execute(command);

    return { command, executionResult };
  }

  private async persistReconciliation(routerId: string, desiredState: Record<string, unknown>, adapterKind: "simulator" | "mikrotik") {
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    if (!reconciliationClient?.upsert) {
      return;
    }

    try {
      await reconciliationClient.upsert({
        where: { routerId },
        create: {
          routerId,
          adapterKind,
          status: "PENDING",
          desiredJson: desiredState,
          appliedJson: {},
        },
        update: {
          adapterKind,
          status: "PENDING",
          desiredJson: desiredState,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn("Unable to persist router adapter reconciliation", error);
    }
  }

  async enrollRouter(routerId: string, input: EnrollRouterInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const adapterConfig = this.buildAdapterConfig(input);
    const adapterConfigPayload: Record<string, string | boolean | null> = {
      adapterKind: adapterConfig.adapterKind,
      connectionMode: adapterConfig.connectionMode,
      pairingCode: adapterConfig.pairingCode ?? null,
    };
    const command = this.buildCommandEnvelope(routerId, "heartbeat", { adapterConfig });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "ENROLL",
        entityType: "RouterAdapter",
        entityId: routerId,
        afterJson: { adapterType: input.adapterType, pairingCode: input.pairingCode, adapterConfig: adapterConfigPayload },
      },
    });

    await this.executeAdapterCommand(command, input.adapterType === "mikrotik" ? "mikrotik" : "simulator", this.buildAdapterConfig(input));

    return {
      routerId,
      adapterType: input.adapterType,
      paired: true,
      pairingCode: input.pairingCode,
      enrolledAt: new Date().toISOString(),
      command,
    };
  }

  async applyProfile(routerId: string, input: ApplyProfileInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const configurationVersion = 1;
    const command = this.buildCommandEnvelope(routerId, "apply_profile", {
      packageName: input.packageName,
      speedMbps: input.speedMbps ?? 0,
      dataCapGb: input.dataCapGb ?? 0,
    });
    const appliedProfile = {
      packageName: input.packageName,
      speedMbps: input.speedMbps ?? 0,
      dataCapGb: input.dataCapGb ?? 0,
    };

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "APPLY_PROFILE",
        entityType: "RouterAdapter",
        entityId: routerId,
        beforeJson: { routerId },
        afterJson: { appliedProfile, configurationVersion },
      },
    });

    const { command: executedCommand } = await this.executeAdapterCommand(command, "simulator", this.buildAdapterConfig({ adapterType: "simulator", pairingCode: routerId } as EnrollRouterInput));
    await this.persistCommand(executedCommand);
    await this.persistReconciliation(routerId, appliedProfile, "simulator");

    return {
      routerId,
      adapterType: "simulator",
      status: "APPLIED",
      configurationVersion,
      appliedProfile,
      appliedAt: new Date().toISOString(),
      command,
    } as RouterAdapterCommandResult & { command: AdapterCommandEnvelope };
  }

  async createRouterUser(routerId: string, input: CreateRouterUserInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const command = this.buildCommandEnvelope(routerId, "create_user", {
      username: input.username,
      password: input.password,
      profileName: input.profileName ?? "default",
      expiresAt: input.expiresAt ?? null,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE_ROUTER_USER",
        entityType: "RouterAdapter",
        entityId: routerId,
        afterJson: { username: input.username, profileName: input.profileName ?? "default" },
      },
    });

    const { command: executedCommand } = await this.executeAdapterCommand(
      command,
      "simulator",
      this.buildAdapterConfig({ adapterType: "simulator", pairingCode: routerId } as EnrollRouterInput),
    );
    await this.persistCommand(executedCommand);

    return {
      routerId,
      adapterType: "simulator",
      status: "APPLIED",
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    } as RouterAdapterCommandResult & { command: AdapterCommandEnvelope };
  }

  async createVoucher(routerId: string, input: CreateVoucherInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const command = this.buildCommandEnvelope(routerId, "create_voucher", {
      code: input.code,
      dataGb: input.dataGb ?? 0,
      durationHours: input.durationHours ?? 0,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE_VOUCHER",
        entityType: "RouterAdapter",
        entityId: routerId,
        afterJson: { code: input.code, dataGb: input.dataGb ?? 0 },
      },
    });

    const { command: executedCommand } = await this.executeAdapterCommand(
      command,
      "simulator",
      this.buildAdapterConfig({ adapterType: "simulator", pairingCode: routerId } as EnrollRouterInput),
    );
    await this.persistCommand(executedCommand);

    return {
      routerId,
      adapterType: "simulator",
      status: "APPLIED",
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    } as RouterAdapterCommandResult & { command: AdapterCommandEnvelope };
  }

  async getStatus(routerId: string, organizationId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    return {
      routerId,
      adapterType: "simulator",
      connected: true,
      lastHeartbeatAt: new Date().toISOString(),
      status: "ACTIVE",
    } as RouterAdapterStatus;
  }

  async getSessionSnapshot(routerId: string, organizationId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    return {
      routerId,
      adapterType: "simulator",
      activeSessions: 3,
      connectedClients: 3,
      lastHeartbeatAt: new Date().toISOString(),
    };
  }

  async getLifecycleState(routerId: string, organizationId: string): Promise<RouterAdapterLifecycleState> {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const commandClient = (prisma as any).routerAdapterCommand;
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    const pendingCommands = commandClient?.findMany
      ? await commandClient.findMany({ where: { routerId } })
      : [];
    const reconciliation = reconciliationClient?.findFirst
      ? await reconciliationClient.findFirst({ where: { routerId } })
      : null;

    return {
      routerId,
      adapterKind: "simulator",
      pendingCommands: pendingCommands.filter((command: { status?: string }) => command.status === "PENDING").length,
      reconciliation: {
        id: reconciliation?.id ?? `${routerId}-reconciliation`,
        status: reconciliation?.status ?? "PENDING",
        desiredJson: reconciliation?.desiredJson ?? {},
        appliedJson: reconciliation?.appliedJson ?? {},
      },
    };
  }
}
