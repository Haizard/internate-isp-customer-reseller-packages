import type { NextFunction, Request, Response } from "express";
import { RouterAdaptersService } from "./routerAdapters.service";
import {
  applyProfileSchema,
  createHotspotProfileSchema,
  createPoolSchema,
  createPppoeProfileSchema,
  createQueueSchema,
  createRouterUserSchema,
  createVoucherSchema,
  disconnectUserSchema,
  enrollRouterSchema,
  setSimulationSchema,
  suspendUserSchema,
} from "./routerAdapters.dto";

const service = new RouterAdaptersService();

export class RouterAdaptersController {
  async enrollRouter(req: Request, res: Response, next: NextFunction) {
    try {
      const input = enrollRouterSchema.parse(req.body);
      const result = await service.enrollRouter(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async applyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const input = applyProfileSchema.parse(req.body);
      const result = await service.applyProfile(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createRouterUser(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRouterUserSchema.parse(req.body);
      const result = await service.createRouterUser(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVoucherSchema.parse(req.body);
      const result = await service.createVoucher(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getStatus(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async disconnectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const input = disconnectUserSchema.parse(req.body);
      const result = await service.disconnectUser(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const input = suspendUserSchema.parse(req.body);
      const result = await service.suspendUser(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createQueueSchema.parse(req.body);
      const result = await service.createQueue(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createPool(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPoolSchema.parse(req.body);
      const result = await service.createPool(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createPppoeProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPppoeProfileSchema.parse(req.body);
      const result = await service.createPppoeProfile(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async createHotspotProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createHotspotProfileSchema.parse(req.body);
      const result = await service.createHotspotProfile(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async reconcile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.reconcile(req.params.routerId, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async setSimulation(req: Request, res: Response, next: NextFunction) {
    try {
      const input = setSimulationSchema.parse(req.body);
      const result = await service.setSimulation(req.params.routerId, input, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getSessions(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getUsage(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getHealth(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCommands(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getCommands(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async retryCommand(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.retryCommand(req.params.routerId, req.params.commandId, req.auth!.organizationId, req.auth!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSessionSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getSessionSnapshot(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getLifecycleState(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getLifecycleState(req.params.routerId, req.auth!.organizationId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
