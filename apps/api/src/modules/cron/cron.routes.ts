import { Router, type Request, type Response, type NextFunction } from "express";
import { CronController } from "./cron.controller";

const router = Router();
const controller = new CronController();

/**
 * Cron authentication guard.
 * Supports two methods:
 * 1. X-Cron-Secret header matching CRON_SECRET env var
 * 2. Vercel Cron Jobs send CRON_SECRET as Authorization: Bearer <token>
 */
function cronGuard(req: Request, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;

  // Method 1: X-Cron-Secret header
  const headerSecret = req.headers["x-cron-secret"];
  if (cronSecret && headerSecret === cronSecret) {
    return next();
  }

  // Method 2: Vercel cron sends CRON_SECRET as Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (cronSecret && token === cronSecret) {
      return next();
    }
  }

  res.status(401).json({ error: "Unauthorized: missing or invalid cron secret" });
}

router.get("/check-expirations", cronGuard, controller.runChecks);

export default router;
