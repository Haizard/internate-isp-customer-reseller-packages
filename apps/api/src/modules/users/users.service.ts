import bcrypt from "bcryptjs";
import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { CreateUserInput } from "./users.dto";

export class UsersService {
  async list(orgIds: string[]) {
    return prisma.user.findMany({
      where: { organizationId: { in: orgIds } },
      select: { id: true, name: true, email: true, role: true, organizationId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createForOrg(input: CreateUserInput, organizationId: string, actorUserId: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "Email already exists");
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        organizationId,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        afterJson: { email: user.email, role: user.role },
      },
    });
    return user;
  }
}
