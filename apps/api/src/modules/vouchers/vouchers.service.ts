import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { CreateVoucherBatchInput } from "./vouchers.dto";
import type { UpdateVoucherStatusInput } from "./vouchers.dto";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

export class VouchersService {
  async createBatch(input: CreateVoucherBatchInput, organizationId: string, actorUserId: string) {
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const vouchers = [];
    for (let i = 0; i < input.count; i++) {
      const voucher = await prisma.voucher.create({
        data: {
          code: generateCode(),
          organizationId,
          locationId: input.locationId ?? null,
          dataGb: input.dataGb ?? null,
          durationHours: input.durationHours ?? null,
          expiresAt,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
      });
      vouchers.push(voucher);
    }

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "VoucherBatch",
        entityId: vouchers[0]?.id ?? "",
        afterJson: { count: input.count, dataGb: input.dataGb, durationHours: input.durationHours },
      },
    });
    return vouchers;
  }

  async list(orgIds: string[], locationId?: string) {
    return prisma.voucher.findMany({
      where: {
        organizationId: { in: orgIds },
        ...(locationId ? { locationId } : {}),
      },
      include: { location: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async updateStatus(id: string, input: UpdateVoucherStatusInput, orgIds: string[], actorUserId: string) {
    const voucher = await prisma.voucher.findFirst({ where: { id, organizationId: { in: orgIds } } });
    if (!voucher) throw new AppError(404, "Voucher not found");
    const updated = await prisma.voucher.update({ where: { id }, data: { status: input.status, updatedByUserId: actorUserId } });
    await prisma.auditLog.create({ data: { actorUserId, action: "UPDATE", entityType: "Voucher", entityId: id, beforeJson: { status: voucher.status }, afterJson: { status: updated.status } } });
    return updated;
  }
}
