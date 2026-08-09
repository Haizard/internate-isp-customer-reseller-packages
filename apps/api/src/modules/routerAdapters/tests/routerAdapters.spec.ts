import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    router: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { RouterAdaptersService } from "../routerAdapters.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new RouterAdaptersService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RouterAdaptersService.applyProfile", () => {
  it("applies a simulator profile and returns a command result", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1", name: "Gateway A" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const result = await service.applyProfile(
      "router-1",
      { packageName: "Fiber 50", speedMbps: 50, dataCapGb: 1000 },
      "org-1",
      "user-1",
    );

    expect(result.adapterType).toBe("simulator");
    expect(result.status).toBe("APPLIED");
    expect(result.configurationVersion).toBe(1);
    expect(result.appliedProfile.packageName).toBe("Fiber 50");
  });

  it("rejects a router outside the caller's organization", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue(null as never);

    await expect(
      service.applyProfile("router-1", { packageName: "Fiber 50" }, "org-1", "user-1"),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("RouterAdaptersService.getStatus", () => {
  it("returns a simulator heartbeat snapshot", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1", name: "Gateway A" } as never);

    const status = await service.getStatus("router-1", "org-1");

    expect(status.adapterType).toBe("simulator");
    expect(status.connected).toBe(true);
    expect(status.lastHeartbeatAt).toBeDefined();
  });
});
