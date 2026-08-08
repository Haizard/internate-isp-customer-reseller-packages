import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    organization: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    location: { count: vi.fn() },
    router: { count: vi.fn() },
    customer: { count: vi.fn() },
    user: { count: vi.fn() },
    voucher: { count: vi.fn() },
    subscription: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { OrganizationsService } from "../organizations.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new OrganizationsService();
const actorId = "user-1";
const orgIds = ["org-1", "org-2"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrganizationsService.overview", () => {
  it("returns counts plus mrrCents computed from active subscriptions", async () => {
    vi.mocked(prisma.organization.count).mockResolvedValue(2);
    vi.mocked(prisma.location.count).mockResolvedValue(1);
    vi.mocked(prisma.router.count).mockResolvedValue(1);
    vi.mocked(prisma.customer.count).mockResolvedValue(3);
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([
      { package: { priceCents: 25000 } },
      { package: { priceCents: 45000 } },
    ] as never);

    const result = await service.overview(orgIds);

    expect(result).toEqual({
      resellers: 2,
      locations: 1,
      routers: 1,
      customers: 3,
      activeCustomers: 3,
      mrrCents: 70000,
    });
  });
});

describe("OrganizationsService.mrrCents", () => {
  it("sums package price for scoped active customers", async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([
      { package: { priceCents: 100 } },
      { package: { priceCents: 250 } },
    ] as never);
    const total = await service.mrrCents(orgIds);
    expect(total).toBe(350);
  });

  it("scopes to tenant orgs when provided", async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([] as never);
    await service.mrrCents(orgIds);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customer: expect.objectContaining({ organizationId: { in: orgIds } }) },
      }),
    );
  });
});

describe("OrganizationsService.platformOverview", () => {
  it("aggregates platform-wide stats with unscoped MRR", async () => {
    vi.mocked(prisma.organization.count).mockResolvedValue(1);
    vi.mocked(prisma.location.count).mockResolvedValue(1);
    vi.mocked(prisma.router.count).mockResolvedValue(1);
    vi.mocked(prisma.customer.count).mockResolvedValue(3);
    vi.mocked(prisma.user.count).mockResolvedValue(4);
    vi.mocked(prisma.voucher.count).mockResolvedValue(5);
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([
      { package: { priceCents: 45000 } },
    ] as never);

    const result = await service.platformOverview();

    expect(result.isps).toBe(1);
    expect(result.resellers).toBe(1);
    expect(result.customers).toBe(3);
    expect(result.activeCustomers).toBe(3);
    expect(result.users).toBe(4);
    expect(result.vouchers).toBe(5);
    expect(result.mrrCents).toBe(45000);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customer: expect.not.objectContaining({ organizationId: expect.anything() }) },
      }),
    );
  });
});

describe("OrganizationsService.create", () => {
  it("creates an org with audit actor fields and logs audit", async () => {
    vi.mocked(prisma.organization.create).mockResolvedValue({ id: "org-9", name: "New" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const result = await service.create({ name: "New", type: "RESELLER" }, actorId);

    expect(prisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ createdByUserId: actorId, updatedByUserId: actorId }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(result.name).toBe("New");
  });
});

describe("OrganizationsService.updateStatus", () => {
  it("throws 404 for a missing organization", async () => {
    vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never);
    await expect(service.updateStatus("org-x", { status: "ACTIVE" }, actorId)).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
