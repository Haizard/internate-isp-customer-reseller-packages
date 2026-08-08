import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    package: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    bandwidthRule: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    subscription: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { PackagesService } from "../packages.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new PackagesService();
const actorId = "user-1";
const orgIds = ["org-1", "org-2"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PackagesService.create", () => {
  it("creates a package with audit fields and logs an audit entry", async () => {
    vi.mocked(prisma.package.create).mockResolvedValue({
      id: "pkg-1",
      name: "Home Basic",
      priceCents: 25000,
    } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const result = await service.create(
      { name: "Home Basic", speedMbps: 10, priceCents: 25000, currency: "TZS" },
      "org-1",
      actorId,
    );

    expect(prisma.package.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Home Basic",
          organizationId: "org-1",
          createdByUserId: actorId,
          updatedByUserId: actorId,
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(result.name).toBe("Home Basic");
  });
});

describe("PackagesService.list", () => {
  it("filters packages by the tenant org scope", async () => {
    vi.mocked(prisma.package.findMany).mockResolvedValue([] as never);
    await service.list(orgIds);
    expect(prisma.package.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: { in: orgIds } } }),
    );
  });
});

describe("PackagesService.update", () => {
  it("throws 404 when the package is outside the tenant scope", async () => {
    vi.mocked(prisma.package.findFirst).mockResolvedValue(null as never);
    await expect(service.update("pkg-x", { priceCents: 1 }, "org-1", actorId)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("updates the package and writes updatedByUserId", async () => {
    vi.mocked(prisma.package.findFirst).mockResolvedValue({ id: "pkg-1", name: "Old" } as never);
    vi.mocked(prisma.package.update).mockResolvedValue({ id: "pkg-1", name: "New" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    await service.update("pkg-1", { name: "New" }, "org-1", actorId);

    expect(prisma.package.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ updatedByUserId: actorId }) }),
    );
  });
});

describe("PackagesService.popularity", () => {
  it("counts subscriptions per package and sorts descending", async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([
      { packageId: "pkg-a", package: { id: "pkg-a", name: "A" } },
      { packageId: "pkg-b", package: { id: "pkg-b", name: "B" } },
      { packageId: "pkg-a", package: { id: "pkg-a", name: "A" } },
    ] as never);

    const result = await service.popularity(orgIds);
    expect(result).toEqual([
      { package: { id: "pkg-a", name: "A" }, count: 2 },
      { package: { id: "pkg-b", name: "B" }, count: 1 },
    ]);
  });
});

describe("Bandwidth rules", () => {
  it("listRules rejects packages outside the tenant scope", async () => {
    vi.mocked(prisma.package.findFirst).mockResolvedValue(null as never);
    await expect(service.listRules("pkg-x", orgIds)).rejects.toBeInstanceOf(AppError);
  });

  it("createRule creates a rule attached to the package and logs audit", async () => {
    vi.mocked(prisma.package.findFirst).mockResolvedValue({ id: "pkg-1" } as never);
    vi.mocked(prisma.bandwidthRule.create).mockResolvedValue({
      id: "rule-1",
      name: "Business Hours Throttle",
      downloadMbps: 10,
      uploadMbps: 5,
    } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const rule = await service.createRule(
      "pkg-1",
      { name: "Business Hours Throttle", downloadMbps: 10, uploadMbps: 5, priority: 1 },
      orgIds,
      actorId,
    );

    expect(prisma.bandwidthRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ packageId: "pkg-1", createdByUserId: actorId }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(rule.name).toBe("Business Hours Throttle");
  });

  it("updateRule rejects rules whose package is outside scope", async () => {
    vi.mocked(prisma.bandwidthRule.findFirst).mockResolvedValue(null as never);
    await expect(service.updateRule("rule-x", { priority: 3 }, orgIds, actorId)).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
