import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ISP", "RESELLER"]),
  parentOrgId: z.string().optional(),
});

export const updateOrgStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgStatusInput = z.infer<typeof updateOrgStatusSchema>;
