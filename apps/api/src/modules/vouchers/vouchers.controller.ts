import type { NextFunction, Request, Response } from "express";
import { VouchersService } from "./vouchers.service";
import { createVoucherBatchSchema, updateVoucherStatusSchema } from "./vouchers.dto";

const service = new VouchersService();

export class VouchersController {
  async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVoucherBatchSchema.parse(req.body);
      const vouchers = await service.createBatch(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: vouchers });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const vouchers = await service.list(req.orgIds ?? []);
      res.json({ data: vouchers });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateVoucherStatusSchema.parse(req.body);
      const voucher = await service.updateStatus(req.params.id, input, req.orgIds ?? [], req.auth!.id);
      res.json({ data: voucher });
    } catch (err) { next(err); }
  }
}
