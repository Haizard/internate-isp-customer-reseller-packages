import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    router: { findFirst: vi.fn(), update: vi.fn() },
    routerAdapterCommand: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    routerAdapterReconciliation: { findFirst: vi.fn(), upsert: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { RouterAdaptersService } from "../routerAdapters.service";
import { AppError } from "../../../middleware/errorHandler";

type Mock = ReturnType<typeof vi.fn>;
const commands = (prisma as unknown as { routerAdapterCommand: Record<string, Mock> }).routerAdapterCommand;
const reconciliations = (prisma as unknown as { routerAdapterReconciliation: Record<string, Mock> }).routerAdapterReconciliation;
const router = prisma.router as unknown as Record<string, Mock>;

const service = new RouterAdaptersService();

const routerRow = { id: "router-1", name: "Gateway A", status: "ACTIVE" };

beforeEach(() => {
  vi.clearAllMocks();
  router.findFirst.mockResolvedValue(routerRow as never);
  router.update.mockResolvedValue({} as never);
  reconciliations.findFirst.mockResolvedValue(null as never);
  reconciliations.upsert.mockResolvedValue({} as never);
  commands.create.mockResolvedValue({} as never);
  commands.findMany.mockResolvedValue([] as never);
  commands.update.mockResolvedValue({} as never);
  (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as never);
});

describe("RouterAdaptersService command lifecycle", () => {
  it("creates a queue command and applies it on the simulator", async () => {
    const result = await service.createQueue("router-1", { name: "home-q", maxLimitMbps: 50 }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.command.kind).toBe("create_queue");
    expect(result.command.payload).toMatchObject({ maxLimit: "50M/50M" });
    expect(commands.create).toHaveBeenCalled();
  });

  it("creates a pool command", async () => {
    const result = await service.createPool("router-1", { name: "dhcp-pool", ranges: "192.168.88.100-192.168.88.200" }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.command.kind).toBe("create_pool");
  });

  it("creates a PPPoE profile command", async () => {
    const result = await service.createPppoeProfile("router-1", { name: "pppoe-10", rateLimitMbps: 20 }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.command.kind).toBe("create_pppoe_profile");
  });

  it("creates a hotspot profile command", async () => {
    const result = await service.createHotspotProfile("router-1", { name: "guest-net", maxSessions: 25 }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.command.kind).toBe("create_hotspot_profile");
  });

  it("disconnects a user through the adapter", async () => {
    const result = await service.disconnectUser("router-1", { username: "cust01" }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.command.kind).toBe("disconnect_user");
    expect(result.command.payload).toMatchObject({ username: "cust01" });
  });

  it("suspends a user and marks the router suspended", async () => {
    const result = await service.suspendUser("router-1", { username: "cust01" }, "org-1", "user-1");

    expect(result.suspended).toBe(true);
    expect(router.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUSPENDED" }) }),
    );
  });

  it("reuses an existing command when the idempotency key matches", async () => {
    commands.findFirst.mockResolvedValue({
      id: "cmd-dup",
      routerId: "router-1",
      kind: "disconnect_user",
      payload: { username: "cust01" },
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);

    const result = await service.disconnectUser(
      "router-1",
      { username: "cust01", idempotencyKey: "disconnect-cust01-v1" },
      "org-1",
      "user-1",
    );

    expect(result.command.id).toBe("cmd-dup");
    expect(commands.create).not.toHaveBeenCalled();
  });
});

describe("RouterAdaptersService reconcile", () => {
  it("writes an applied reconciliation snapshot", async () => {
    const result = await service.reconcile("router-1", "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.desiredState).toMatchObject({ routerId: "router-1", configurationVersion: 1 });
    expect(reconciliations.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ status: "APPLIED" }) }),
    );
  });
});

describe("RouterAdaptersService retryCommand", () => {
  it("retries a failed command through the adapter", async () => {
    commands.findFirst.mockResolvedValue({
      id: "cmd-fail",
      routerId: "router-1",
      kind: "create_pool",
      payload: { name: "pool-1", ranges: "10.0.0.2-10.0.0.100" },
      status: "FAILED",
      attempts: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);

    const result = await service.retryCommand("router-1", "cmd-fail", "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(commands.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING", lastError: null }) }),
    );
  });

  it("rejects retrying a command that did not fail", async () => {
    commands.findFirst.mockResolvedValue({
      id: "cmd-ok",
      routerId: "router-1",
      kind: "create_queue",
      payload: {},
      status: "APPLIED",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);

    await expect(service.retryCommand("router-1", "cmd-ok", "org-1", "user-1")).rejects.toBeInstanceOf(AppError);
  });
});

describe("RouterAdaptersService setSimulation", () => {
  it("persists offline/expiry simulation flags in the reconciliation desired state", async () => {
    reconciliations.findFirst.mockResolvedValue({
      id: "recon-1",
      routerId: "router-1",
      adapterKind: "simulator",
      desiredJson: { routerId: "router-1", configurationVersion: 1 },
    } as never);

    const result = await service.setSimulation("router-1", { offline: true }, "org-1", "user-1");

    expect(result.simulation).toMatchObject({ offline: true, expiry: false });
    expect(reconciliations.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          desiredJson: expect.objectContaining({ simulation: expect.objectContaining({ offline: true }) }),
        }),
      }),
    );
  });
});

describe("RouterAdaptersService queries", () => {
  it("returns simulator-backed sessions", async () => {
    const result = await service.getSessions("router-1", "org-1");

    expect(result.status).toBe("OK");
    expect(result.data.activeSessions).toBe(3);
  });

  it("returns simulator-backed usage", async () => {
    const result = await service.getUsage("router-1", "org-1");

    expect(result.status).toBe("OK");
    expect(result.data.usageByDay).toBeDefined();
  });

  it("returns simulator-backed health", async () => {
    const result = await service.getHealth("router-1", "org-1");

    expect(result.status).toBe("OK");
    expect(result.data.cpuPercent).toBeDefined();
  });

  it("lists persisted commands for a router", async () => {
    commands.findMany.mockResolvedValue([{ id: "cmd-1", kind: "create_queue", status: "APPLIED" }] as never);

    const result = await service.getCommands("router-1", "org-1");

    expect(result).toHaveLength(1);
    expect(commands.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ routerId: "router-1" }) }),
    );
  });
});
