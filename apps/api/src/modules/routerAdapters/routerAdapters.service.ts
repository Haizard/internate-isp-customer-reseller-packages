import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type {
  ApplyProfileInput,
  CreateHotspotProfileInput,
  CreatePoolInput,
  CreatePppoeProfileInput,
  CreateQueueInput,
  CreateRouterUserInput,
  CreateVoucherInput,
  DisconnectUserInput,
  EnrollRouterInput,
  SuspendUserInput,
} from "./routerAdapters.dto";
import type { RouterAdapterCommandResult, RouterAdapterStatus } from "./routerAdapters.types";
import type { AdapterCommandEnvelope, AdapterConfig, AdapterKind, AdapterQueryKind, RouterAdapter } from "./routerAdapters.contract";
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

  private buildCommandEnvelope(
    routerId: string,
    kind: AdapterCommandEnvelope["kind"],
    payload: Record<string, unknown>,
    idempotencyKey?: string,
  ): AdapterCommandEnvelope {
    const now = new Date().toISOString();
    return {
      id: `${routerId}-${kind}-${Date.now()}`,
      routerId,
      kind,
      payload,
      status: "PENDING",
      idempotencyKey,
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
          idempotencyKey: command.idempotencyKey ?? null,
          attempts: 0,
          createdAt: command.createdAt,
          updatedAt: command.updatedAt,
        },
      });
    } catch (error) {
      console.warn("Unable to persist router adapter command", error);
    }
  }

  private async prepareCommand(
    routerId: string,
    kind: AdapterCommandEnvelope["kind"],
    payload: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<AdapterCommandEnvelope> {
    const command = this.buildCommandEnvelope(routerId, kind, payload, idempotencyKey);
    const commandClient = (prisma as any).routerAdapterCommand;

    if (idempotencyKey && commandClient?.findFirst) {
      const existing = await commandClient.findFirst({ where: { idempotencyKey } });
      if (existing) {
        return existing as AdapterCommandEnvelope;
      }
    }

    await this.persistCommand(command);
    return command;
  }

  private async assertRouterInScope(routerId: string, organizationId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    return router;
  }

  private async getAdapterKind(routerId: string): Promise<AdapterKind> {
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    const reconciliation = reconciliationClient?.findFirst
      ? await reconciliationClient.findFirst({ where: { routerId } })
      : null;
    return reconciliation?.adapterKind === "mikrotik" ? "mikrotik" : "simulator";
  }

  private buildAdapter(config: AdapterConfig): RouterAdapter {
    return config.adapterKind === "mikrotik"
      ? new MikroTikAdapter(config)
      : new SimulatorAdapter(config);
  }

  private buildRouterAdapterConfig(routerId: string, adapterKind: AdapterKind): AdapterConfig {
    const config: AdapterConfig = {
      adapterKind,
      connectionMode: adapterKind === "mikrotik" ? "api" : "simulator",
      pairingCode: routerId,
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

  private async runCommand(envelope: AdapterCommandEnvelope, adapterKind: AdapterKind, actorUserId: string) {
    if (envelope.status === "APPLIED") {
      return {
        command: envelope,
        executionResult: { status: "APPLIED" as const, configurationVersion: 1, message: "Command already applied (idempotent replay)" },
      };
    }

    const adapter = this.buildAdapter(this.buildRouterAdapterConfig(envelope.routerId, adapterKind));
    await adapter.connect();
    const executionResult = await adapter.execute(envelope);

    const commandClient = (prisma as any).routerAdapterCommand;
    if (commandClient?.update) {
      try {
        await commandClient.update({
          where: { id: envelope.id },
          data: {
            status: executionResult.status,
            executedAt: new Date().toISOString(),
            attempts: { increment: 1 },
            lastError: executionResult.status === "FAILED" ? executionResult.message ?? null : null,
          },
        });
      } catch (error) {
        console.warn("Unable to record router adapter command result", error);
      }
    }

    if ((prisma as any).router?.update) {
      try {
        await (prisma as any).router.update({
          where: { id: envelope.routerId },
          data: { status: executionResult.status === "FAILED" ? "OFFLINE" : "ACTIVE" },
        });
      } catch (error) {
        console.warn("Unable to update router status from adapter result", error);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: `COMMAND_${envelope.kind.toUpperCase()}`,
          entityType: "RouterAdapter",
          entityId: envelope.routerId,
          afterJson: { commandId: envelope.id, kind: envelope.kind, status: executionResult.status },
        },
      });
    } catch (error) {
      console.warn("Unable to audit router adapter command", error);
    }

    return { command: envelope, executionResult };
  }

  private async executeAdapterCommand(
    command: AdapterCommandEnvelope,
    adapterKind: "simulator" | "mikrotik",
    config?: AdapterConfig,
  ) {
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

  async createVoucher(routerId: string, input: CreateVoucherInput, organizationId: string, actorUserId: string | null) {
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

  private async queryRouter(routerId: string, organizationId: string, kind: AdapterQueryKind) {
    const router = await this.assertRouterInScope(routerId, organizationId);
    const adapterKind = await this.getAdapterKind(routerId);
    const adapter = this.buildAdapter(this.buildRouterAdapterConfig(routerId, adapterKind));
    await adapter.connect();

    const result = await adapter.query({ routerId, kind });
    return { router, result, adapterKind };
  }

  async getSessionSnapshot(routerId: string, organizationId: string) {
    const { result } = await this.queryRouter(routerId, organizationId, "sessions");
    const sessions = Array.isArray(result.data.sessions) ? result.data.sessions : [];
    const activeSessions = Number(result.data.activeSessions ?? sessions.length ?? 0);

    return {
      routerId,
      adapterType: "simulator",
      activeSessions,
      connectedClients: activeSessions,
      lastHeartbeatAt: new Date().toISOString(),
    };
  }

  async getSessions(routerId: string, organizationId: string) {
    const { adapterKind, result } = await this.queryRouter(routerId, organizationId, "sessions");
    return { adapterType: adapterKind, ...result, routerId };
  }

  async getUsage(routerId: string, organizationId: string) {
    const { adapterKind, result } = await this.queryRouter(routerId, organizationId, "usage");
    return { adapterType: adapterKind, ...result, routerId };
  }

  async getHealth(routerId: string, organizationId: string) {
    const { adapterKind, result } = await this.queryRouter(routerId, organizationId, "health");
    return { adapterType: adapterKind, ...result, routerId };
  }

  async getCommands(routerId: string, organizationId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const commandClient = (prisma as any).routerAdapterCommand;
    const commands = commandClient?.findMany
      ? await commandClient.findMany({ where: { routerId }, orderBy: { createdAt: "desc" }, take: 50 })
      : [];
    return commands;
  }

  async disconnectUser(routerId: string, input: DisconnectUserInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const command = await this.prepareCommand(
      routerId,
      "disconnect_user",
      { username: input.username, reason: input.reason ?? null },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async suspendUser(routerId: string, input: SuspendUserInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const command = await this.prepareCommand(
      routerId,
      "disconnect_user",
      { username: input.username, reason: input.reason ?? "suspended by operator" },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    if ((prisma as any).router?.update) {
      try {
        await (prisma as any).router.update({
          where: { id: routerId },
          data: { status: "SUSPENDED" },
        });
      } catch (error) {
        console.warn("Unable to mark router suspended", error);
      }
    }

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      suspended: true,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async createQueue(routerId: string, input: CreateQueueInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const maxLimit = input.maxLimitMbps ? `${input.maxLimitMbps}M/${input.maxLimitMbps}M` : "50M/50M";
    const command = await this.prepareCommand(
      routerId,
      "create_queue",
      {
        name: input.name,
        maxLimit,
        burstLimit: input.burstLimitMbps ? `${input.burstLimitMbps}M/${input.burstLimitMbps}M` : null,
      },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async createPool(routerId: string, input: CreatePoolInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const command = await this.prepareCommand(
      routerId,
      "create_pool",
      { name: input.name, ranges: input.ranges },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async createPppoeProfile(routerId: string, input: CreatePppoeProfileInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const command = await this.prepareCommand(
      routerId,
      "create_pppoe_profile",
      {
        name: input.name,
        localAddress: input.localAddress ?? null,
        remoteAddress: input.remoteAddress ?? null,
        rateLimitMbps: input.rateLimitMbps ?? null,
      },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async createHotspotProfile(routerId: string, input: CreateHotspotProfileInput, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const command = await this.prepareCommand(
      routerId,
      "create_hotspot_profile",
      {
        name: input.name,
        keepaliveTimeout: input.keepaliveTimeout ?? null,
        maxSessions: input.maxSessions ?? null,
      },
      input.idempotencyKey,
    );
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(command, adapterKind, actorUserId);

    return {
      routerId,
      adapterType: adapterKind,
      status: executionResult.status,
      configurationVersion: 1,
      appliedAt: new Date().toISOString(),
      command,
    };
  }

  async reconcile(routerId: string, organizationId: string, actorUserId: string) {
    const router = await this.assertRouterInScope(routerId, organizationId);
    const adapterKind = await this.getAdapterKind(routerId);

    const desiredState = {
      routerId,
      routerName: router.name,
      status: router.status ?? "ACTIVE",
      configurationVersion: 1,
    };

    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    if (reconciliationClient?.upsert) {
      try {
        await reconciliationClient.upsert({
          where: { routerId },
          create: {
            routerId,
            adapterKind,
            status: "APPLIED",
            desiredJson: desiredState,
            appliedJson: desiredState,
          },
          update: {
            adapterKind,
            status: "APPLIED",
            desiredJson: desiredState,
            appliedJson: desiredState,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn("Unable to persist router adapter reconciliation", error);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: "RECONCILE",
          entityType: "RouterAdapter",
          entityId: routerId,
          afterJson: { desiredState },
        },
      });
    } catch (error) {
      console.warn("Unable to audit router adapter reconciliation", error);
    }

    return {
      routerId,
      adapterType: adapterKind,
      status: "APPLIED",
      configurationVersion: 1,
      desiredState,
      appliedState: desiredState,
      reconciledAt: new Date().toISOString(),
    };
  }

  async retryCommand(routerId: string, commandId: string, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const commandClient = (prisma as any).routerAdapterCommand;
    if (!commandClient?.findFirst) {
      throw new AppError(503, "Command persistence is unavailable");
    }

    const existing = await commandClient.findFirst({ where: { id: commandId, routerId } });
    if (!existing) {
      throw new AppError(404, "Command not found in your scope");
    }
    if (existing.status !== "FAILED") {
      throw new AppError(409, "Only failed commands can be retried");
    }

    await commandClient.update({
      where: { id: commandId },
      data: { status: "PENDING", lastError: null },
    });

    const envelope: AdapterCommandEnvelope = {
      id: existing.id,
      routerId: existing.routerId,
      kind: existing.kind,
      payload: existing.payload,
      status: "PENDING",
      idempotencyKey: existing.idempotencyKey ?? undefined,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const adapterKind = await this.getAdapterKind(routerId);
    const { executionResult } = await this.runCommand(envelope, adapterKind, actorUserId);

    return { routerId, commandId, status: executionResult.status, executionResult, command: envelope };
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
