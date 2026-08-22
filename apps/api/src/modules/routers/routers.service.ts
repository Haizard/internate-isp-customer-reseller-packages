import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { canAddRouter } from "../subscriptions/plans";
import type { CreateRouterInput, UpdateRouterInput } from "./routers.dto";

export class RoutersService {
  async create(input: CreateRouterInput, organizationId: string, actorUserId: string) {
    const location = await prisma.location.findFirst({
      where: { id: input.locationId, organizationId },
    });
    if (!location) throw new AppError(400, "Location not found in your scope");

    // Check subscription router limit
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (org) {
      const routerCount = await prisma.router.count({
        where: { location: { organizationId } },
      });
      if (!canAddRouter(routerCount, org.subscriptionPlan)) {
        throw new AppError(403, `Router limit reached for ${org.subscriptionPlan} plan. Upgrade to add more routers.`);
      }
    }

    const router = await prisma.router.create({
      data: {
        name: input.name,
        macAddress: input.macAddress,
        status: input.status ?? "ACTIVE",
        locationId: input.locationId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Router",
        entityId: router.id,
        afterJson: { name: router.name, macAddress: router.macAddress },
      },
    });
    return router;
  }

  async list(orgIds: string[]) {
    const routers = await prisma.router.findMany({
      where: { location: { organizationId: { in: orgIds } } },
      include: {
        location: { select: { id: true, name: true } },
        _count: { select: { customers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return routers.map((router: (typeof routers)[number]) => ({
      ...router,
      customerCount: router._count.customers,
    }));
  }

  async update(id: string, input: UpdateRouterInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id, location: { organizationId } },
    });
    if (!router) throw new AppError(404, "Router not found");

    const updated = await prisma.router.update({
      where: { id },
      data: { ...input, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Router",
        entityId: updated.id,
        beforeJson: { status: router.status },
        afterJson: { status: updated.status },
      },
    });
    return updated;
  }
}
