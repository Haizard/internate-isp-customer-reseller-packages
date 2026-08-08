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
