import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { MarkReadInput } from "./notifications.dto";

export class NotificationsService {
  async list(customerId: string, unreadOnly: boolean) {
    return prisma.notification.findMany({
      where: {
        customerId,
        deletedAt: null,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async unreadCount(customerId: string): Promise<number> {
    return prisma.notification.count({
      where: { customerId, deletedAt: null, readAt: null },
    });
  }

  async markRead(customerId: string, input: MarkReadInput) {
    if (!input.all && (!input.ids || input.ids.length === 0)) {
      throw new AppError(400, "Provide ids or set all=true");
    }
    const result = await prisma.notification.updateMany({
      where: {
        customerId,
        deletedAt: null,
        readAt: null,
        ...(input.all ? {} : { id: { in: input.ids! } }),
      },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
