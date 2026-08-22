import { Request, Response, NextFunction } from "express";
import { BusinessAIService } from "./business-ai.service";

const service = new BusinessAIService();

export class BusinessAIController {
  async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const result = await service.startConversation(userId, req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const result = await service.sendMessage(userId, req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async applyPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { planId } = req.params;
      const result = await service.applyPlan(userId, planId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const result = await service.listConversations(userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { planId } = req.params;
      const result = await service.getConversation(userId, planId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { planId } = req.params;
      const result = await service.deleteConversation(userId, planId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const result = await service.getInsights(userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDemandPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { location } = req.query;
      const result = await service.getDemandPredictions(userId, location as string | undefined);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getProgressReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const result = await service.getProgressReport(userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
