import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    router: { findFirst: vi.fn() },
    routerAdapterCommand: { create: vi.fn(), findMany: vi.fn() },
    routerAdapterReconciliation: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { RouterAdaptersService } from "../routerAdapters.service";

const prismaWithLifecycle = prisma as typeof prisma & {
  routerAdapterCommand: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  routerAdapterReconciliation: {
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

const service = new RouterAdaptersService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RouterAdaptersService lifecycle", () => {
  it("creates a queued command and reconciliation entry when applying a profile", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1", name: "Gateway A" } as never);
    vi.mocked(prismaWithLifecycle.routerAdapterCommand.create).mockResolvedValue({ id: "cmd-1" } as never);
    vi.mocked(prismaWithLifecycle.routerAdapterReconciliation.upsert).mockResolvedValue({ id: "recon-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    await service.applyProfile("router-1", { packageName: "Fiber 50", speedMbps: 50 }, "org-1", "user-1");

    expect(prismaWithLifecycle.routerAdapterCommand.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ routerId: "router-1", status: "PENDING" }),
      }),
    );
    expect(prismaWithLifecycle.routerAdapterReconciliation.upsert).toHaveBeenCalled();
  });

  it("returns queue and reconciliation state for a router", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1", name: "Gateway A" } as never);
    vi.mocked(prismaWithLifecycle.routerAdapterCommand.findMany).mockResolvedValue([
      { id: "cmd-1", routerId: "router-1", status: "PENDING", kind: "apply_profile" },
    ] as never);
    vi.mocked(prismaWithLifecycle.routerAdapterReconciliation.findFirst).mockResolvedValue({
      id: "recon-1",
      status: "PENDING",
      desiredJson: { packageName: "Fiber 50" },
      appliedJson: {},
    } as never);

    const state = await service.getLifecycleState("router-1", "org-1");

    expect(state.pendingCommands).toBe(1);
    expect(state.reconciliation.status).toBe("PENDING");
  });

  it("continues even if command persistence fails", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1", name: "Gateway A" } as never);
    vi.mocked(prismaWithLifecycle.routerAdapterCommand.create).mockRejectedValue(new Error("db down"));
    vi.mocked(prismaWithLifecycle.routerAdapterReconciliation.upsert).mockResolvedValue({ id: "recon-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const result = await service.applyProfile("router-1", { packageName: "Fiber 50" }, "org-1", "user-1");

    expect(result.status).toBe("APPLIED");
    expect(result.appliedProfile.packageName).toBe("Fiber 50");
  });
});
