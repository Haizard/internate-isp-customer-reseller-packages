import type { NextFunction, Request, Response } from "express";
import { HotspotService } from "./hotspot.service";
import { redeemVoucherSchema } from "./hotspot.dto";

const service = new HotspotService();

export class HotspotController {
  async getHotspot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getHotspot(req.params.slug);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async redeem(req: Request, res: Response, next: NextFunction) {
    try {
      const input = redeemVoucherSchema.parse(req.body);
      const result = await service.redeem(req.params.slug, input);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
