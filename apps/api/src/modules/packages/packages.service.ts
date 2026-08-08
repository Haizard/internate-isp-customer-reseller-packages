import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { CreatePackageInput, UpdatePackageInput } from "./packages.dto";

export class PackagesService {
  async create(input: CreatePackageInput, organizationId: string, actorUserId: string) {
    const pkg = await prisma.package.create({
      data: {
        name: input.name,
        speedMbps: input.speedMbps,
        dataCapGb: input.dataCapGb ?? null,
        priceCents: input.priceCents,
        currency: input.currency,
        organizationId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Package",
        entityId: pkg.id,
        afterJson: { name: pkg.name, priceCents: pkg.priceCents },
      },
    });
    return pkg;
  }

  async list(orgIds: string[]) {
    return prisma.package.findMany({
      where: { organizationId: { in: orgIds } },
      orderBy: { priceCents: "asc" },
    });
  }

  async update(id: string, input: UpdatePackageInput, organizationId: string, actorUserId: string) {
    const before = await prisma.package.findFirst({
      where: { id, organizationId },
    });
    if (!before) throw new AppError(404, "Package not found");
    const pkg = await prisma.package.update({
      where: { id },
      data: { ...input, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Package",
        entityId: pkg.id,
        beforeJson: { name: before.name, priceCents: before.priceCents },
        afterJson: { name: pkg.name, priceCents: pkg.priceCents },
      },
    });
    return pkg;
  }

  async popularity(orgIds: string[]) {
    const subscriptions = await prisma.subscription.findMany({
      where: { package: { organizationId: { in: orgIds } } },
      include: { package: true },
    });
    const counts = new Map<string, { package: { id: string; name: string }; count: number }>();
    for (const sub of subscriptions) {
      const entry = counts.get(sub.packageId) ?? {
        package: { id: sub.package.id, name: sub.package.name },
        count: 0,
      };
      entry.count += 1;
      counts.set(sub.packageId, entry);
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }
}
