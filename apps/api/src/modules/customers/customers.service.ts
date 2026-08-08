import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type {
  CreateCustomerInput,
  CreateRequestInput,
  RedeemVoucherInput,
  UpdateCustomerInput,
  UpdateWifiInput,
} from "./customers.dto";

export class CustomersService {
  async create(input: CreateCustomerInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: input.routerId, location: { organizationId } },
    });
    if (!router) throw new AppError(400, "Router not found in your scope");

    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        wifiSsid: input.wifiSsid ?? `${input.name.replace(/\s+/g, "")}_WiFi`,
        wifiPassword: input.wifiPassword ?? "changeme123",
        routerId: input.routerId,
        organizationId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });

    if (input.packageId) {
      const pkg = await prisma.package.findFirst({
        where: { id: input.packageId, organizationId: { in: [organizationId, ...(await this.parentOrgIds(organizationId))] } },
      });
      if (pkg) {
        await prisma.subscription.create({
          data: {
            customerId: customer.id,
            packageId: pkg.id,
            createdByUserId: actorUserId,
            updatedByUserId: actorUserId,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Customer",
        entityId: customer.id,
        afterJson: { name: customer.name, phone: customer.phone },
      },
    });
    return customer;
  }

  async list(orgIds: string[]) {
    const customers = await prisma.customer.findMany({
      where: { organizationId: { in: orgIds }, deletedAt: null },
      include: {
        router: { select: { id: true, name: true } },
        subscription: { include: { package: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return customers;
  }

  async get(id: string, orgIds: string[]) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
      include: {
        router: { select: { id: true, name: true, macAddress: true } },
        subscription: { include: { package: true } },
        devices: true,
      },
    });
    if (!customer) throw new AppError(404, "Customer not found");
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput, orgIds: string[], actorUserId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: { in: orgIds } },
    });
    if (!customer) throw new AppError(404, "Customer not found");

    const updated = await prisma.customer.update({
      where: { id },
      data: { ...input, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Customer",
        entityId: id,
        beforeJson: { status: customer.status },
        afterJson: { status: updated.status },
      },
    });
    return updated;
  }

  async updateWifi(customerId: string, input: UpdateWifiInput) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new AppError(404, "Customer not found");
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { wifiSsid: input.wifiSsid, wifiPassword: input.wifiPassword },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: null,
        action: "UPDATE",
        entityType: "Customer",
        entityId: customerId,
        afterJson: { wifiSsid: input.wifiSsid },
      },
    });
    return updated;
  }

  async devices(customerId: string) {
    const devices = await prisma.device.findMany({ where: { customerId } });
    if (devices.length === 0) {
      // seed mock devices for demo experience
      return [
        { id: "mock-1", customerId, macAddress: "AA:11:22:33:44:55", deviceName: "Samsung Galaxy", lastSeenAt: new Date(Date.now() - 1000 * 60 * 5) },
        { id: "mock-2", customerId, macAddress: "BB:22:33:44:55:66", deviceName: "Laptop", lastSeenAt: new Date(Date.now() - 1000 * 60 * 20) },
        { id: "mock-3", customerId, macAddress: "CC:33:44:55:66:77", deviceName: "Smart TV", lastSeenAt: new Date(Date.now() - 1000 * 60 * 60) },
      ];
    }
    return devices;
  }

  async usage(customerId: string) {
    const records = await prisma.usageRecord.findMany({
      where: { customerId },
      orderBy: { day: "asc" },
      take: 30,
    });
    if (records.length === 0) {
      const now = new Date();
      return Array.from({ length: 14 }, (_, i) => {
        const day = new Date(now);
        day.setDate(day.getDate() - (13 - i));
        const base = (i * 7 + Math.floor(Math.random() * 12) + 8) * 1024 * 1024;
        return { id: `mock-${i}`, customerId, day, bytesUsed: BigInt(base) };
      });
    }
    return records;
  }

  async redeemVoucher(customerId: string, input: RedeemVoucherInput) {
    const voucher = await prisma.voucher.findUnique({ where: { code: input.code.trim() } });
    if (!voucher) throw new AppError(404, "Voucher not found");
    if (voucher.status === "USED") throw new AppError(409, "Voucher already used");
    if (voucher.status === "EXPIRED" || (voucher.expiresAt && voucher.expiresAt < new Date())) {
      throw new AppError(409, "Voucher has expired");
    }
    const updated = await prisma.voucher.update({
      where: { id: voucher.id },
      data: { status: "USED", usedByCustomerId: customerId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: null,
        action: "REDEEM",
        entityType: "Voucher",
        entityId: voucher.id,
        afterJson: { code: voucher.code },
      },
    });
    return updated;
  }

  async createRequest(customerId: string, input: CreateRequestInput, actorUserId: string | null = null) {
    return prisma.serviceRequest.create({
      data: {
        type: input.type,
        message: input.message ?? null,
        customerId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
  }

  async listRequests(customerId: string) {
    return prisma.serviceRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
  }

  private async parentOrgIds(organizationId: string): Promise<string[]> {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (org?.parentOrgId) return [org.parentOrgId];
    return [];
  }
}
