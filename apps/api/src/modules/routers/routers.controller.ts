import type { NextFunction, Request, Response } from "express";
import { RoutersService } from "./routers.service";
import { createRouterSchema, updateRouterSchema } from "./routers.dto";

const service = new RoutersService();

export class RoutersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRouterSchema.parse(req.body);
      const router = await service.create(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: router });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const routers = await service.list(req.orgIds ?? []);
      res.json({ data: routers });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateRouterSchema.parse(req.body);
      const router = await service.update(req.params.id, input, req.auth!.organizationId, req.auth!.id);
      res.json({ data: router });
    } catch (err) {
      next(err);
    }
  }
}
