import type { NextFunction, Request, Response } from "express";
import { CustomersService } from "./customers.service";
import {
  createCustomerSchema,
  createRequestSchema,
  redeemVoucherSchema,
  updateCustomerSchema,
  updateWifiSchema,
} from "./customers.dto";

const service = new CustomersService();

export class CustomersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCustomerSchema.parse(req.body);
      const customer = await service.create(input, req.auth!.organizationId, req.auth!.id);
      res.status(201).json({ data: customer });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await service.list(req.orgIds ?? []);
      res.json({ data: customers });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await service.get(req.params.id, req.orgIds ?? []);
      res.json({ data: customer });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateCustomerSchema.parse(req.body);
      const customer = await service.update(req.params.id, input, req.orgIds ?? [], req.auth!.id);
      res.json({ data: customer });
    } catch (err) {
      next(err);
    }
  }

  // --- Customer self-service ---

  async updateWifi(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateWifiSchema.parse(req.body);
      const customer = await service.updateWifi(req.customerId!, input);
      res.json({ data: { wifiSsid: customer.wifiSsid } });
    } catch (err) {
      next(err);
    }
  }

  async devices(req: Request, res: Response, next: NextFunction) {
    try {
      const devices = await service.devices(req.customerId!);
      res.json({ data: devices });
    } catch (err) {
      next(err);
    }
  }

  async usage(req: Request, res: Response, next: NextFunction) {
    try {
      const usage = await service.usage(req.customerId!);
      res.json({
        data: usage.map((record: { id: string; customerId: string; day: Date; bytesUsed: bigint }) => ({
          ...record,
          bytesUsed: record.bytesUsed.toString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  async redeemVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const input = redeemVoucherSchema.parse(req.body);
      const voucher = await service.redeemVoucher(req.customerId!, input, req.auth!.id);
      res.json({ data: voucher });
    } catch (err) {
      next(err);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRequestSchema.parse(req.body);
      const request = await service.createRequest(req.customerId!, input);
      res.status(201).json({ data: request });
    } catch (err) {
      next(err);
    }
  }

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await service.listRequests(req.customerId!);
      res.json({ data: requests });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await service.get(req.customerId!, [req.auth!.organizationId]);
      res.json({ data: customer });
    } catch (err) {
      next(err);
    }
  }
}
