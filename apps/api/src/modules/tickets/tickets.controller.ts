import type { NextFunction, Request, Response } from "express";
import { TicketsService } from "./tickets.service";
import {
  addCommentSchema,
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "./tickets.dto";

const service = new TicketsService();

export class TicketsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTicketSchema.parse(req.body);
      const ticket = await service.create(input, req.orgIds ?? [], req.auth!.id, req.auth!.organizationId);
      res.status(201).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listTicketsQuerySchema.parse(req.query);
      res.json({ data: await service.list(query, req.orgIds ?? []) });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ data: await service.get(req.params.id, req.orgIds ?? []) });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateTicketSchema.parse(req.body);
      res.json({ data: await service.update(req.params.id, input, req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = addCommentSchema.parse(req.body);
      res.status(201).json({ data: await service.addComment(req.params.id, input, req.orgIds ?? [], req.auth!.id, req.auth!.role) });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const input = assignTicketSchema.parse(req.body);
      res.json({ data: await service.assign(req.params.id, input.assigneeId, req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ data: await service.dashboard(req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }
}
