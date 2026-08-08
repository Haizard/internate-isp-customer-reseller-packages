import type { NextFunction, Request, Response } from "express";
import { LocationsService } from "./locations.service";
import { createLocationSchema, updateLocationSchema } from "./locations.dto";

const service = new LocationsService();

export class LocationsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createLocationSchema.parse(req.body);
      const location = await service.create(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: location });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await service.list(req.orgIds ?? []);
      res.json({ data: locations });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateLocationSchema.parse(req.body);
      const location = await service.update(req.params.id, input, req.auth!.organizationId, req.auth!.id);
      res.json({ data: location });
    } catch (err) {
      next(err);
    }
  }
}
