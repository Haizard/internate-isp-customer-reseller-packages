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
import { OpenWrtAdapter } from "./openwrtAdapter";
import { SimulatorAdapter } from "./simulatorAdapter";

export class RouterAdaptersService {
  private buildAdapterConfig(input: EnrollRouterInput): AdapterConfig {
    const adapterKind = input.adapterType;
    const config: AdapterConfig = {
      adapterKind,
      connectionMode: adapterKind === "simulator" ? "simulator" : adapterKind === "mikrotik" ? "api" : "ssh",
      pairingCode: input.pairingCode,
      host: input.host,
      port: input.port,
      username: input.username,
      password: input.password,
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
    if (reconciliation?.adapterKind === "mikrotik") return "mikrotik";
    if (reconciliation?.adapterKind === "openwrt") return "openwrt";
    return "simulator";
  }

  private buildAdapter(config: AdapterConfig): RouterAdapter {
    if (config.adapterKind === "mikrotik") return new MikroTikAdapter(config);
    if (config.adapterKind === "openwrt") return new OpenWrtAdapter(config);
    return new SimulatorAdapter(config);
  }

  private buildRouterAdapterConfig(routerId: string, adapterKind: AdapterKind, connection?: Record<string, unknown>): AdapterConfig {
    const config: AdapterConfig = {
      adapterKind,
      connectionMode: adapterKind === "simulator" ? "simulator" : adapterKind === "mikrotik" ? "api" : "ssh",
      pairingCode: routerId,
      host: typeof connection?.host === "string" ? connection.host : undefined,
      port: typeof connection?.port === "number" ? connection.port : undefined,
      username: typeof connection?.username === "string" ? connection.username : undefined,
      password: typeof connection?.password === "string" ? connection.password : undefined,
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

  private async resolveSimulation(routerId: string) {
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    const reconciliation = reconciliationClient?.findFirst
      ? await reconciliationClient.findFirst({ where: { routerId } })
      : null;
    const simulation = (reconciliation?.desiredJson as { simulation?: { offline?: boolean; expiry?: boolean } } | null)?.simulation;
    return {
      offline: simulation?.offline === true,
      expiry: simulation?.expiry === true,
    };
  }

  private async resolveAdapterConfig(routerId: string, adapterKind: AdapterKind): Promise<AdapterConfig> {
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    const reconciliation = reconciliationClient?.findFirst
      ? await reconciliationClient.findFirst({ where: { routerId } })
      : null;
    const desired = (reconciliation?.desiredJson as Record<string, unknown> | null) ?? {};
    const connection = (desired.connection as Record<string, unknown> | undefined) ?? {};

    const config = this.buildRouterAdapterConfig(routerId, adapterKind, connection);
    if (adapterKind === "simulator") {
      const simulation = await this.resolveSimulation(routerId);
      config.simulateOffline = simulation.offline;
      config.simulateExpiry = simulation.expiry;
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

    const adapter = this.buildAdapter(await this.resolveAdapterConfig(envelope.routerId, adapterKind));
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
    adapterKind: "simulator" | "mikrotik" | "openwrt",
    config?: AdapterConfig,
  ) {
    const adapterConfig = config ?? {
      adapterKind,
      connectionMode: adapterKind === "simulator" ? "simulator" : adapterKind === "mikrotik" ? "api" : "ssh",
      pairingCode: command.routerId,
    };

    const adapter: RouterAdapter = adapterKind === "mikrotik"
      ? new MikroTikAdapter(adapterConfig)
      : adapterKind === "openwrt"
        ? new OpenWrtAdapter(adapterConfig)
        : new SimulatorAdapter(adapterConfig);

    await adapter.connect();
    const executionResult = await adapter.execute(command);

    return { command, executionResult };
  }

  private async persistReconciliation(routerId: string, desiredState: Record<string, unknown>, adapterKind: "simulator" | "mikrotik" | "openwrt") {
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

    await this.executeAdapterCommand(
      command,
      input.adapterType === "mikrotik" ? "mikrotik" : input.adapterType === "openwrt" ? "openwrt" : "simulator",
      this.buildAdapterConfig(input),
    );

    await this.persistEnrollment(routerId, input);

    return {
      routerId,
      adapterType: input.adapterType,
      paired: true,
      pairingCode: input.pairingCode,
      enrolledAt: new Date().toISOString(),
      command,
    };
  }

  private async persistEnrollment(routerId: string, input: EnrollRouterInput) {
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    if (!reconciliationClient?.upsert) return;

    const adapterKind = input.adapterType;
    const desiredJson: Record<string, unknown> = {
      routerId,
      adapterType: adapterKind,
      configurationVersion: 1,
      connection:
        adapterKind === "openwrt"
          ? {
              host: input.host,
              port: input.port,
              username: input.username,
              password: input.password,
            }
          : { mode: adapterKind === "mikrotik" ? "api" : "simulator" },
    };

    try {
      await reconciliationClient.upsert({
        where: { routerId },
        create: { routerId, adapterKind, status: "APPLIED", desiredJson, appliedJson: desiredJson },
        update: { adapterKind, status: "APPLIED", desiredJson, appliedJson: desiredJson, updatedAt: new Date().toISOString() },
      });
    } catch (error) {
      console.warn("Unable to persist router adapter enrollment", error);
    }
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

    const { command: executedCommand } = await this.executeAdapterCommand(
      command,
      await this.getAdapterKind(routerId),
      await this.resolveAdapterConfig(routerId, await this.getAdapterKind(routerId)),
    );
    await this.persistCommand(executedCommand);
    await this.persistReconciliation(routerId, appliedProfile, await this.getAdapterKind(routerId));

    return {
      routerId,
      adapterType: await this.getAdapterKind(routerId),
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
      await this.getAdapterKind(routerId),
      await this.resolveAdapterConfig(routerId, await this.getAdapterKind(routerId)),
    );
    await this.persistCommand(executedCommand);

    return {
      routerId,
      adapterType: await this.getAdapterKind(routerId),
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
      await this.getAdapterKind(routerId),
      await this.resolveAdapterConfig(routerId, await this.getAdapterKind(routerId)),
    );
    await this.persistCommand(executedCommand);

    return {
      routerId,
      adapterType: await this.getAdapterKind(routerId),
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

    const adapterKind = await this.getAdapterKind(routerId);
    const adapter = this.buildAdapter(await this.resolveAdapterConfig(routerId, adapterKind));
    const connection = (await adapter.connect()) as { connected?: boolean };
    const connected = connection.connected === true;

    return {
      routerId,
      adapterType: adapterKind,
      connected,
      lastHeartbeatAt: new Date().toISOString(),
      status: connected ? "ACTIVE" : "OFFLINE",
    } as RouterAdapterStatus;
  }

  private async queryRouter(routerId: string, organizationId: string, kind: AdapterQueryKind) {
    const router = await this.assertRouterInScope(routerId, organizationId);
    const adapterKind = await this.getAdapterKind(routerId);
    const adapter = this.buildAdapter(await this.resolveAdapterConfig(routerId, adapterKind));
    await adapter.connect();

    const result = await adapter.query({ routerId, kind });
    return { router, result, adapterKind };
  }

  async getSessionSnapshot(routerId: string, organizationId: string) {
    const { adapterKind, result } = await this.queryRouter(routerId, organizationId, "sessions");
    const sessions = Array.isArray(result.data.sessions) ? result.data.sessions : [];
    const activeSessions = Number(result.data.activeSessions ?? sessions.length ?? 0);

    return {
      routerId,
      adapterType: adapterKind,
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

  async getCapabilities(routerId: string, organizationId: string) {
    const { adapterKind, result } = await this.queryRouter(routerId, organizationId, "capabilities");
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
    const simulation = await this.resolveSimulation(routerId);

    const desiredState = {
      routerId,
      routerName: router.name,
      status: router.status ?? "ACTIVE",
      configurationVersion: 1,
      simulation,
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

  async setSimulation(routerId: string, input: { offline?: boolean; expiry?: boolean }, organizationId: string, actorUserId: string) {
    await this.assertRouterInScope(routerId, organizationId);
    const reconciliationClient = (prisma as any).routerAdapterReconciliation;
    const existing = reconciliationClient?.findFirst
      ? await reconciliationClient.findFirst({ where: { routerId } })
      : null;

    const desiredJson = (existing?.desiredJson as Record<string, unknown> | null) ?? { routerId, configurationVersion: 1 };
    const current = (desiredJson.simulation as { offline?: boolean; expiry?: boolean } | undefined) ?? { offline: false, expiry: false };
    const simulation = {
      offline: input.offline ?? current.offline ?? false,
      expiry: input.expiry ?? current.expiry ?? false,
    };
    desiredJson.simulation = simulation;

    const adapterKind = existing?.adapterKind ?? "simulator";
    if (reconciliationClient?.upsert) {
      try {
        await reconciliationClient.upsert({
          where: { routerId },
          create: { routerId, adapterKind, status: "APPLIED", desiredJson, appliedJson: desiredJson },
          update: { adapterKind, status: "APPLIED", desiredJson, appliedJson: desiredJson, updatedAt: new Date().toISOString() },
        });
      } catch (error) {
        console.warn("Unable to persist router adapter simulation state", error);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: "SET_SIMULATION",
          entityType: "RouterAdapter",
          entityId: routerId,
          afterJson: { simulation },
        },
      });
    } catch (error) {
      console.warn("Unable to audit router adapter simulation state", error);
    }

    return { routerId, simulation };
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
      adapterKind: (reconciliation?.adapterKind ?? "simulator") as RouterAdapterLifecycleState["adapterKind"],
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
