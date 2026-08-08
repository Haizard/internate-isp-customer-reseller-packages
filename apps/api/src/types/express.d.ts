import type { User } from "@prisma/client";
import type { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  customerId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      auth?: AuthUser;
      orgIds?: string[];
      customerId?: string;
    }
  }
}

export {};
