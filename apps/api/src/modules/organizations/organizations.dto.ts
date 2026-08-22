import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ISP", "RESELLER"]),
  parentOrgId: z.string().optional(),
});

export const updateOrgStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]),
});

export const updateBrandingSchema = z.object({
  brandName: z.string().min(1).optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  welcomeMessage: z.string().optional(),
  footerText: z.string().optional(),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgStatusInput = z.infer<typeof updateOrgStatusSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
