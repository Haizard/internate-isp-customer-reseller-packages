import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { SUBSCRIPTION_PLANS, getPlan, canAddRouter } from "./plans";

export class SubscriptionsService {
  async getPlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  async getCurrentPlan(organizationId: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError(404, "Organization not found");

    const plan = getPlan(org.subscriptionPlan);
    const routerCount = await prisma.router.count({
      where: { location: { organizationId } },
    });

    return {
      plan,
      subscriptionExpires: org.subscriptionExpires,
      currentRouters: routerCount,
      canAddMore: canAddRouter(routerCount, org.subscriptionPlan),
      voucherCommissionPct: org.voucherCommissionPct,
    };
  }

  async upgradePlan(organizationId: string, planId: string, actorUserId: string) {
    const plan = getPlan(planId);
    if (planId === "free") throw new AppError(400, "Cannot downgrade to free plan");

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError(404, "Organization not found");

    // Set subscription to expire in 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionPlan: planId,
        subscriptionExpires: expiresAt,
        voucherCommissionPct: plan.voucherCommissionPct,
        updatedByUserId: actorUserId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "SUBSCRIBE",
        entityType: "Organization",
        entityId: organizationId,
        beforeJson: { plan: org.subscriptionPlan },
        afterJson: { plan: planId, expires: expiresAt.toISOString() },
      },
    });

    return updated;
  }

  async cancelPlan(organizationId: string, actorUserId: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError(404, "Organization not found");

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionPlan: "free",
        subscriptionExpires: null,
        voucherCommissionPct: 5,
        updatedByUserId: actorUserId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CANCEL_SUBSCRIPTION",
        entityType: "Organization",
        entityId: organizationId,
        beforeJson: { plan: org.subscriptionPlan },
        afterJson: { plan: "free" },
      },
    });

    return updated;
  }

  async checkAndEnforceLimits(organizationId: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) return;

    // Check if subscription expired
    if (org.subscriptionExpires && org.subscriptionExpires < new Date() && org.subscriptionPlan !== "free") {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionPlan: "free",
          subscriptionExpires: null,
          voucherCommissionPct: 5,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: "system:cron",
          action: "SUBSCRIPTION_EXPIRED",
          entityType: "Organization",
          entityId: organizationId,
          beforeJson: { plan: org.subscriptionPlan },
          afterJson: { plan: "free" },
        },
      });
    }
  }
}
