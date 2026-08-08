import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { CreateLocationInput, UpdateLocationInput } from "./locations.dto";

export class LocationsService {
  async create(input: CreateLocationInput, organizationId: string, actorUserId: string) {
    const location = await prisma.location.create({
      data: {
        name: input.name,
        address: input.address ?? null,
        organizationId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Location",
        entityId: location.id,
        afterJson: { name: location.name },
      },
    });
    return location;
  }

  async list(orgIds: string[]) {
    return prisma.location.findMany({
      where: { organizationId: { in: orgIds } },
      include: {
        _count: { select: { routers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, input: UpdateLocationInput, organizationId: string, actorUserId: string) {
    const before = await prisma.location.findFirst({ where: { id, organizationId } });
    if (!before) throw new AppError(404, "Location not found");
    const location = await prisma.location.update({
      where: { id },
      data: { ...input, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Location",
        entityId: location.id,
        beforeJson: { name: before.name },
        afterJson: { name: location.name },
      },
    });
    return location;
  }
}
