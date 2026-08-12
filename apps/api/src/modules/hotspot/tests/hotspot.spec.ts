import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    location: { findUnique: vi.fn() },
    voucher: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    package: { findMany: vi.fn() },
  },
}));

vi.mock("../routerAdapters/routerAdapters.service", () => ({
  RouterAdaptersService: class {
    createVoucher = vi.fn().mockResolvedValue({ status: "APPLIED" });
  },
}));

import { prisma } from "../../../prisma/client";
import { HotspotService } from "../hotspot.service";
import { AppError } from "../../../middleware/errorHandler";

const location = {
  id: "loc-1",
  name: "Kariakoo Cafe",
  organization: { id: "org-1", name: "DukaNet", type: "RESELLER", status: "ACTIVE" },
  routers: [{ id: "router-1", name: "Kariakoo AP", status: "ACTIVE" }],
};

const service = new HotspotService();

const mocks = {
  locationFindUnique: vi.mocked(prisma.location.findUnique),
  voucherFindUnique: vi.mocked(prisma.voucher.findUnique),
  voucherFindMany: vi.mocked(prisma.voucher.findMany),
  voucherUpdate: vi.mocked(prisma.voucher.update),
  packageFindMany: vi.mocked(prisma.package.findMany),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.locationFindUnique.mockResolvedValue(location as never);
  mocks.voucherFindMany.mockResolvedValue([
    { id: "v-1", dataGb: 10, durationHours: 24, expiresAt: null },
  ] as never);
  mocks.packageFindMany.mockResolvedValue([
    { id: "p-1", name: "Daily 10GB", speedMbps: 20, dataCapGb: 10, priceCents: 2000, currency: "TZS" },
  ] as never);
});

describe("HotspotService.getHotspot", () => {
  it("returns the location, router, vouchers, and priced packages", async () => {
    const hotspot = await service.getHotspot("loc-1");

    expect(hotspot.locationName).toBe("Kariakoo Cafe");
    expect(hotspot.organization.name).toBe("DukaNet");
    expect(hotspot.router?.name).toBe("Kariakoo AP");
    expect(hotspot.vouchers).toHaveLength(1);
    expect(hotspot.packages[0].priceCents).toBe(2000);
  });

  it("rejects an unknown or inactive hotspot", async () => {
    mocks.locationFindUnique.mockResolvedValue(null as never);

    await expect(service.getHotspot("missing")).rejects.toBeInstanceOf(AppError);
  });
});

describe("HotspotService.redeem", () => {
  it("redeems an unused voucher and provisions it on the router", async () => {
    mocks.voucherFindUnique.mockResolvedValue({
      id: "v-1",
      code: "AAAA-BBBB",
      organizationId: "org-1",
      dataGb: 10,
      durationHours: 24,
      expiresAt: null,
      status: "UNUSED",
    } as never);
    mocks.voucherUpdate.mockResolvedValue({
      id: "v-1",
      code: "AAAA-BBBB",
      dataGb: 10,
      durationHours: 24,
      expiresAt: null,
      status: "USED",
    } as never);

    const result = await service.redeem("loc-1", { code: "aaaa-bbbb" });

    expect(result.redeemed).toBe(true);
    expect(mocks.voucherUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "USED" }) }),
    );
  });

  it("rejects a voucher from a different organization", async () => {
    mocks.voucherFindUnique.mockResolvedValue({
      id: "v-2",
      code: "CCCC-DDDD",
      organizationId: "org-other",
      status: "UNUSED",
    } as never);

    await expect(service.redeem("loc-1", { code: "CCCC-DDDD" })).rejects.toBeInstanceOf(AppError);
  });

  it("rejects an already redeemed voucher", async () => {
    mocks.voucherFindUnique.mockResolvedValue({
      id: "v-1",
      code: "AAAA-BBBB",
      organizationId: "org-1",
      status: "USED",
    } as never);

    await expect(service.redeem("loc-1", { code: "AAAA-BBBB" })).rejects.toBeInstanceOf(AppError);
  });

  it("rejects an expired voucher", async () => {
    mocks.voucherFindUnique.mockResolvedValue({
      id: "v-1",
      code: "AAAA-BBBB",
      organizationId: "org-1",
      status: "UNUSED",
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(service.redeem("loc-1", { code: "AAAA-BBBB" })).rejects.toBeInstanceOf(AppError);
  });
});
