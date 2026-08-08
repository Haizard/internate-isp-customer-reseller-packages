import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma/client";

/**
 * Resolves the set of organization ids the authenticated user may access.
 * ISP admins may access their own org and every descendant org (resellers).
 * Resellers access only their own org.
 */
export async function resolveOrgScope(organizationId: string): Promise<string[]> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return [];

  if (org.type === "ISP") {
    const children = await prisma.organization.findMany({
      where: { parentOrgId: organizationId },
      select: { id: true },
    });
    return [org.id, ...children.map((c) => c.id)];
  }
  return [org.id];
}

export function tenantGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  resolveOrgScope(req.auth.organizationId)
    .then((orgIds) => {
      req.orgIds = orgIds;
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Failed to resolve tenant scope" });
    });
}
