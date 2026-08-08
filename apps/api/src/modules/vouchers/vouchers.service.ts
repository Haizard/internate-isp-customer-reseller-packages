import crypto from "crypto";
import { prisma } from "../../prisma/client";
import type { CreateVoucherBatchInput } from "./vouchers.dto";

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
          dataGb: input.dataGb ?? null,
          durationHours: input.durationHours ?? null,
          expiresAt,
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

  async list(orgIds: string[]) {
    return prisma.voucher.findMany({
      where: { organizationId: { in: orgIds } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
