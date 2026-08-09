import type { NextFunction, Request, Response } from "express";
import { RouterAdaptersService } from "./routerAdapters.service";
import { applyProfileSchema, createRouterUserSchema, createVoucherSchema, enrollRouterSchema } from "./routerAdapters.dto";

const service = new RouterAdaptersService();

export class RouterAdaptersController {
  async enrollRouter(req: Request, res: Response, next: NextFunction) {
    try {
      const input = enrollRouterSchema.parse(req.body);
      const result = await service.enrollRouter(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async applyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const input = applyProfileSchema.parse(req.body);
      const result = await service.applyProfile(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createRouterUser(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRouterUserSchema.parse(req.body);
      const result = await service.createRouterUser(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVoucherSchema.parse(req.body);
      const result = await service.createVoucher(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getStatus(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSessionSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getSessionSnapshot(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getLifecycleState(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getLifecycleState(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
