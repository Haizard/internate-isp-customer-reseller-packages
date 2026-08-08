import type { NextFunction, Request, Response } from "express";
import { UsersService } from "./users.service";
import { createUserSchema } from "./users.dto";

const service = new UsersService();

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await service.list(req.orgIds ?? []);
      res.json({ data: users });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createUserSchema.parse(req.body);
      const user = await service.createForOrg(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }
}
