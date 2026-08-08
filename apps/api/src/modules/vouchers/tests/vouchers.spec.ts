import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    voucher: { create: vi.fn(), findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { VouchersService } from "../vouchers.service";

const service = new VouchersService();
const actorId = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VouchersService.createBatch", () => {
  it("creates the requested number of vouchers with codes and audit fields", async () => {
    const createMock = prisma.voucher.create as unknown as ReturnType<typeof vi.fn>;
    createMock.mockImplementation((args: { data: Record<string, unknown> }) => ({
      id: `v-${Math.random()}`,
      code: "ABCD-1234",
      ...args.data,
    }));
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const vouchers = await service.createBatch({ count: 3, dataGb: 5, expiresInDays: 7 }, "org-1", actorId);

    expect(vouchers).toHaveLength(3);
    expect(prisma.voucher.create).toHaveBeenCalledTimes(3);
    expect(prisma.voucher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          dataGb: 5,
          expiresAt: expect.any(Date),
          createdByUserId: actorId,
          updatedByUserId: actorId,
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorUserId: actorId, entityType: "VoucherBatch", action: "CREATE" }),
      }),
    );
  });

  it("generates codes matching the AAAA-AAAA shape", async () => {
    const createMock = prisma.voucher.create as unknown as ReturnType<typeof vi.fn>;
    createMock.mockImplementation((args: { data: Record<string, unknown> }) => ({ id: "v-1", code: args.data.code }));
    const vouchers = await service.createBatch({ count: 5, dataGb: null, durationHours: 24 }, "org-1", actorId);
    for (const v of vouchers) {
      expect(v.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });
});

describe("VouchersService.list", () => {
  it("filters vouchers by tenant org scope", async () => {
    vi.mocked(prisma.voucher.findMany).mockResolvedValue([] as never);
    await service.list(["org-1", "org-2"]);
    expect(prisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: { in: ["org-1", "org-2"] } } }),
    );
  });
});
