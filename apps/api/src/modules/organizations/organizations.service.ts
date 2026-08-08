import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { CreateOrgInput, UpdateOrgStatusInput } from "./organizations.dto";

export class OrganizationsService {
  async create(input: CreateOrgInput, actorUserId: string) {
    const org = await prisma.organization.create({
      data: {
        name: input.name,
        type: input.type,
        parentOrgId: input.parentOrgId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Organization",
        entityId: org.id,
        afterJson: { name: org.name, type: org.type },
      },
    });
    return org;
  }

  async listByType(type: string | undefined, orgIds: string[]) {
    return prisma.organization.findMany({
      where: {
        id: { in: orgIds },
        ...(type ? { type: type as "ISP" | "RESELLER" } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listResellers(orgIds: string[]) {
    const resellers = await prisma.organization.findMany({
      where: {
        id: { in: orgIds },
        type: "RESELLER",
      },
      include: {
        _count: { select: { locations: true, customers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return resellers;
  }

  async updateStatus(id: string, input: UpdateOrgStatusInput, actorUserId: string) {
    const before = await prisma.organization.findUnique({ where: { id } });
    if (!before) throw new AppError(404, "Organization not found");
    const org = await prisma.organization.update({
      where: { id },
      data: { status: input.status, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: input.status === "SUSPENDED" ? "SUSPEND" : "APPROVE",
        entityType: "Organization",
        entityId: org.id,
        beforeJson: { status: before.status },
        afterJson: { status: org.status },
      },
    });
    return org;
  }

  async getHierarchy(rootOrgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: rootOrgId } });
    if (!org) throw new AppError(404, "Organization not found");
    const children = await prisma.organization.findMany({
      where: { parentOrgId: rootOrgId },
      include: { _count: { select: { locations: true, users: true } } },
    });
    return { org, children };
  }

  async overview(orgIds: string[]) {
    const [resellers, locations, routers, customers] = await Promise.all([
      prisma.organization.count({ where: { id: { in: orgIds }, type: "RESELLER" } }),
      prisma.location.count({ where: { organizationId: { in: orgIds } } }),
      prisma.router.count({ where: { location: { organizationId: { in: orgIds } } } }),
      prisma.customer.count({ where: { organizationId: { in: orgIds } } }),
    ]);
    return { resellers, locations, routers, customers };
  }
}
