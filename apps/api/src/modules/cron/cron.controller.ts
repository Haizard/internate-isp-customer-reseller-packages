import type { Request, Response } from "express";
import { CronService } from "./cron.service";

const service = new CronService();

export class CronController {
  /**
   * GET /api/v1/cron/check-expirations
   *
   * Runs all expiration checks (subscriptions + vouchers).
   * Protected by a simple API key check via CRON_SECRET env var.
   * Can be called by Vercel Cron, a cron service, or manually.
   */
  async runChecks(_req: Request, res: Response) {
    try {
      const result = await service.runAllChecks();
      res.json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cron job failed";
      res.status(500).json({ error: message });
    }
  }
}
