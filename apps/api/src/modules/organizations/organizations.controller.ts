import type { NextFunction, Request, Response } from "express";
import { OrganizationsService } from "./organizations.service";
import { createOrgSchema, updateOrgStatusSchema } from "./organizations.dto";

const service = new OrganizationsService();

export class OrganizationsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createOrgSchema.parse(req.body);
      const org = await service.create(input, req.auth!.id);
      res.status(201).json({ data: org });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const orgs = await service.listByType(type, req.orgIds ?? []);
      res.json({ data: orgs });
    } catch (err) {
      next(err);
    }
  }

  async listResellers(req: Request, res: Response, next: NextFunction) {
    try {
      const resellers = await service.listResellers(req.orgIds ?? []);
      res.json({ data: resellers });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateOrgStatusSchema.parse(req.body);
      const org = await service.updateStatus(req.params.id, input, req.auth!.id);
      res.json({ data: org });
    } catch (err) {
      next(err);
    }
  }

  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.overview(req.orgIds ?? []);
      res.json({ data: stats });
    } catch (err) {
      next(err);
    }
  }

  async platformOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.platformOverview();
      res.json({ data: stats });
    } catch (err) {
      next(err);
    }
  }
}
