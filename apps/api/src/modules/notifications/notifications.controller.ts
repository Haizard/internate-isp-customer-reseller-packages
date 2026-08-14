import type { NextFunction, Request, Response } from "express";
import { NotificationsService } from "./notifications.service";
import {
  listNotificationsQuerySchema,
  markReadSchema,
} from "./notifications.dto";

const service = new NotificationsService();

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const data = await service.list(req.customerId!, query.unreadOnly);
      const unreadCount = await service.unreadCount(req.customerId!);
      res.json({ data, meta: { unreadCount } });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const input = markReadSchema.parse(req.body);
      const result = await service.markRead(req.customerId!, input);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
