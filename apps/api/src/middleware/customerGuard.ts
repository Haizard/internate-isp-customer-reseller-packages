import type { NextFunction, Request, Response } from "express";

/**
 * Resolves req.customerId from the authenticated customer user.
 * Only valid for role = CUSTOMER with a linked customer record.
 */
export function customerGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.auth.role !== "CUSTOMER") {
    res.status(403).json({ error: "Forbidden: customer access required" });
    return;
  }
  if (!req.auth.customerId) {
    res.status(403).json({ error: "Customer account not linked" });
    return;
  }
  req.customerId = req.auth.customerId;
  next();
}
