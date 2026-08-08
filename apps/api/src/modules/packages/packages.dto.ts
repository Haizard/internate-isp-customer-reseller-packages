import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().min(1),
  speedMbps: z.number().int().positive(),
  dataCapGb: z.number().int().nonnegative().nullable().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default("TZS"),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

export const createBandwidthRuleSchema = z.object({
  name: z.string().min(1),
  downloadMbps: z.number().int().positive(),
  uploadMbps: z.number().int().positive(),
  priority: z.number().int().default(0),
});

export const updateBandwidthRuleSchema = createBandwidthRuleSchema.partial();

export type CreateBandwidthRuleInput = z.infer<typeof createBandwidthRuleSchema>;
export type UpdateBandwidthRuleInput = z.infer<typeof updateBandwidthRuleSchema>;
