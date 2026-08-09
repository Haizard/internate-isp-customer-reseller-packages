import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import type { ApplyProfileInput, EnrollRouterInput } from "./routerAdapters.dto";
import type { RouterAdapterCommandResult, RouterAdapterStatus } from "./routerAdapters.types";

export class RouterAdaptersService {
  async enrollRouter(routerId: string, input: EnrollRouterInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "ENROLL",
        entityType: "RouterAdapter",
        entityId: routerId,
        afterJson: { adapterType: input.adapterType, pairingCode: input.pairingCode },
      },
    });

    return {
      routerId,
      adapterType: input.adapterType,
      paired: true,
      pairingCode: input.pairingCode,
      enrolledAt: new Date().toISOString(),
    };
  }

  async applyProfile(routerId: string, input: ApplyProfileInput, organizationId: string, actorUserId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    const configurationVersion = 1;
    const appliedProfile = {
      packageName: input.packageName,
      speedMbps: input.speedMbps ?? 0,
      dataCapGb: input.dataCapGb ?? 0,
    };

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId,
        action: "APPLY_PROFILE",
        entityType: "RouterAdapter",
        entityId: routerId,
        beforeJson: { routerId },
        afterJson: { appliedProfile, configurationVersion },
      },
    });

    return {
      routerId,
      adapterType: "simulator",
      status: "APPLIED",
      configurationVersion,
      appliedProfile,
      appliedAt: new Date().toISOString(),
    } as RouterAdapterCommandResult;
  }

  async getStatus(routerId: string, organizationId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    return {
      routerId,
      adapterType: "simulator",
      connected: true,
      lastHeartbeatAt: new Date().toISOString(),
      status: "ACTIVE",
    } as RouterAdapterStatus;
  }

  async getSessionSnapshot(routerId: string, organizationId: string) {
    const router = await prisma.router.findFirst({
      where: { id: routerId, location: { organizationId } },
    });

    if (!router) {
      throw new AppError(404, "Router not found in your scope");
    }

    return {
      routerId,
      adapterType: "simulator",
      activeSessions: 3,
      connectedClients: 3,
      lastHeartbeatAt: new Date().toISOString(),
    };
  }
}
