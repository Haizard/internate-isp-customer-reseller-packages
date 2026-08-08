import type { NextFunction, Request, Response } from "express";
import { PackagesService } from "./packages.service";
import { createPackageSchema, updatePackageSchema } from "./packages.dto";

const service = new PackagesService();

export class PackagesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPackageSchema.parse(req.body);
      const pkg = await service.create(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: pkg });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const packages = await service.list(req.orgIds ?? []);
      res.json({ data: packages });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updatePackageSchema.parse(req.body);
      const pkg = await service.update(req.params.id, input, req.auth!.organizationId, req.auth!.id);
      res.json({ data: pkg });
    } catch (err) {
      next(err);
    }
  }

  async popularity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.popularity(req.orgIds ?? []);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
