import type { NextFunction, Request, Response } from "express";
import { ReportsService } from "./reports.service";

const service = new ReportsService();

export class ReportsController {
  async auditLogs(req: Request, res: Response, next: NextFunction) {
    try { res.json({ data: await service.auditLogs(req.orgIds ?? []) }); } catch (err) { next(err); }
  }

  async resellerSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.resellerSummary(req.orgIds ?? []);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async packagePopularity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.packagePopularity(req.orgIds ?? []);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async earningsByReseller(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.earningsByReseller(req.orgIds ?? []);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
