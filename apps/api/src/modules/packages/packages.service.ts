import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type {
  CreatePackageInput,
  UpdatePackageInput,
  CreateBandwidthRuleInput,
  UpdateBandwidthRuleInput,
} from "./packages.dto";

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

  private async assertPackageInScope(packageId: string, orgIds: string[]) {
    const pkg = await prisma.package.findFirst({
      where: { id: packageId, organizationId: { in: orgIds } },
    });
    if (!pkg) throw new AppError(404, "Package not found");
    return pkg;
  }

  async listRules(packageId: string, orgIds: string[]) {
    await this.assertPackageInScope(packageId, orgIds);
    return prisma.bandwidthRule.findMany({
      where: { packageId },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });
  }

  async createRule(packageId: string, input: CreateBandwidthRuleInput, orgIds: string[], actorUserId: string) {
    await this.assertPackageInScope(packageId, orgIds);
    const rule = await prisma.bandwidthRule.create({
      data: {
        name: input.name,
        downloadMbps: input.downloadMbps,
        uploadMbps: input.uploadMbps,
        priority: input.priority,
        packageId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "BandwidthRule",
        entityId: rule.id,
        afterJson: { name: rule.name, downloadMbps: rule.downloadMbps, uploadMbps: rule.uploadMbps },
      },
    });
    return rule;
  }

  async updateRule(ruleId: string, input: UpdateBandwidthRuleInput, orgIds: string[], actorUserId: string) {
    const before = await prisma.bandwidthRule.findFirst({
      where: { id: ruleId, package: { organizationId: { in: orgIds } } },
    });
    if (!before) throw new AppError(404, "Bandwidth rule not found");
    const rule = await prisma.bandwidthRule.update({
      where: { id: ruleId },
      data: { ...input, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "BandwidthRule",
        entityId: rule.id,
        beforeJson: { name: before.name, downloadMbps: before.downloadMbps, uploadMbps: before.uploadMbps },
        afterJson: { name: rule.name, downloadMbps: rule.downloadMbps, uploadMbps: rule.uploadMbps },
      },
    });
    return rule;
  }
}
