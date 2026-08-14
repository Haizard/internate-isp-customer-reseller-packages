import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    customer: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn() },
    router: { findFirst: vi.fn() },
    package: { findFirst: vi.fn() },
    subscription: { create: vi.fn() },
    voucher: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    device: { findMany: vi.fn() },
    usageRecord: { findMany: vi.fn() },
    serviceRequest: { create: vi.fn(), findMany: vi.fn() },
    ticket: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../../prisma/client";
import { CustomersService } from "../customers.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new CustomersService();
const actorId = "user-1";
const orgIds = ["org-1", "org-2"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomersService.create", () => {
  it("rejects a router outside the caller's organization", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue(null as never);
    await expect(
      service.create({ name: "New", phone: "255700000000", routerId: "router-x" }, "org-1", actorId),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("creates a customer with audit fields and an optional subscription", async () => {
    vi.mocked(prisma.router.findFirst).mockResolvedValue({ id: "router-1" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({} as never);
    vi.mocked(prisma.customer.create).mockResolvedValue({ id: "cust-1", name: "New" } as never);
    vi.mocked(prisma.package.findFirst).mockResolvedValue({ id: "pkg-1" } as never);
    vi.mocked(prisma.subscription.create).mockResolvedValue({} as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma as never) as never);

    await service.create(
      { name: "New", phone: "255700000000", routerId: "router-1", packageId: "pkg-1" },
      "org-1",
      actorId,
    );

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          createdByUserId: actorId,
          updatedByUserId: actorId,
        }),
      }),
    );
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerId: "cust-1", createdByUserId: actorId }),
      }),
    );
  });
});

describe("CustomersService.redeemVoucher", () => {
  it("rejects a used voucher", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: "cust-1", organizationId: "org-1", subscription: null } as never);
    vi.mocked(prisma.voucher.findFirst).mockResolvedValue({ id: "v-1", status: "USED" } as never);
    await expect(service.redeemVoucher("cust-1", { code: "ABCD-1234" })).rejects.toBeInstanceOf(AppError);
  });

  it("marks an unused voucher as USED", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: "cust-1", organizationId: "org-1", subscription: null } as never);
    vi.mocked(prisma.voucher.findFirst).mockResolvedValue({ id: "v-1", status: "UNUSED" } as never);
    vi.mocked(prisma.voucher.update).mockResolvedValue({ id: "v-1", status: "USED" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma as never) as never);

    const result = await service.redeemVoucher("cust-1", { code: "ABCD-1234" });

    expect(prisma.voucher.update).toHaveBeenCalledWith({
      where: { id: "v-1", status: "UNUSED" },
      data: { status: "USED", usedByCustomerId: "cust-1" },
    });
    expect(result.status).toBe("USED");
  });
});

describe("CustomersService.createRequest", () => {
  it("creates a ticket with source CUSTOMER and audit actor id", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: "cust-1", organizationId: "org-1" } as never);
    vi.mocked(prisma.ticket.create).mockResolvedValue({ id: "t-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.createRequest("cust-1", { type: "SUPPORT", message: "slow" }, actorId);
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "CUSTOMER",
          entityType: "Customer",
          entityId: "cust-1",
          organizationId: "org-1",
          createdByUserId: actorId,
          updatedByUserId: actorId,
        }),
      }),
    );
  });
});

describe("CustomersService.listAllRequests", () => {
  it("is tenant scoped", async () => {
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);
    await service.listAllRequests(orgIds);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: { in: orgIds }, deletedAt: null }),
      }),
    );
  });
});

describe("CustomersService.list", () => {
  it("excludes soft-deleted customers and is tenant scoped", async () => {
    vi.mocked(prisma.customer.findMany).mockResolvedValue([] as never);
    await service.list(orgIds);
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: { in: orgIds }, deletedAt: null },
      }),
    );
  });
});
