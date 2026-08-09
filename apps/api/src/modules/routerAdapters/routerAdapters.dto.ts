import { z } from "zod";

export const applyProfileSchema = z.object({
  packageName: z.string().min(1),
  speedMbps: z.number().int().positive().optional(),
  dataCapGb: z.number().int().positive().optional(),
});

export const createRouterUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  profileName: z.string().min(1).optional(),
  expiresAt: z.string().optional(),
});

export const createVoucherSchema = z.object({
  code: z.string().min(1),
  dataGb: z.number().int().positive().optional(),
  durationHours: z.number().int().positive().optional(),
});

export const enrollRouterSchema = z.object({
  adapterType: z.enum(["simulator", "mikrotik"]).default("simulator"),
  pairingCode: z.string().min(1),
});

export type ApplyProfileInput = z.infer<typeof applyProfileSchema>;
export type CreateRouterUserInput = z.infer<typeof createRouterUserSchema>;
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type EnrollRouterInput = z.infer<typeof enrollRouterSchema>;
