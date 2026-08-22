import type { NextFunction, Request, Response } from "express";
import { SubscriptionsService } from "./subscriptions.service";

const service = new SubscriptionsService();

export class SubscriptionsController {
  async getPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await service.getPlans();
      res.json({ data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await service.getCurrentPlan(req.auth!.organizationId);
      res.json({ data: plan });
    } catch (err) {
      next(err);
    }
  }

  async upgradePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.body;
      if (!planId) {
        res.status(400).json({ error: "planId is required" });
        return;
      }
      const org = await service.upgradePlan(req.auth!.organizationId, planId, req.auth!.id);
      res.json({ data: org });
    } catch (err) {
      next(err);
    }
  }

  async cancelPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await service.cancelPlan(req.auth!.organizationId, req.auth!.id);
      res.json({ data: org });
    } catch (err) {
      next(err);
    }
  }
}
