import { z } from "zod";

export const applyProfileSchema = z.object({
  packageName: z.string().min(1),
  speedMbps: z.number().int().positive().optional(),
  dataCapGb: z.number().int().positive().optional(),
});

export const enrollRouterSchema = z.object({
  adapterType: z.enum(["simulator", "mikrotik"]).default("simulator"),
  pairingCode: z.string().min(1),
});

export type ApplyProfileInput = z.infer<typeof applyProfileSchema>;
export type EnrollRouterInput = z.infer<typeof enrollRouterSchema>;
