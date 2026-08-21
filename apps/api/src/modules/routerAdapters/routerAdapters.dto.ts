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
  adapterType: z.enum(["simulator", "mikrotik", "openwrt"]).default("simulator"),
  pairingCode: z.string().min(1),
  host: z.string().optional(),
  port: z.number().int().positive().max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export const disconnectUserSchema = z.object({
  username: z.string().min(1),
  reason: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const suspendUserSchema = z.object({
  username: z.string().min(1),
  reason: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const createQueueSchema = z.object({
  name: z.string().min(1),
  maxLimitMbps: z.number().int().positive().optional(),
  burstLimitMbps: z.number().int().positive().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const createPoolSchema = z.object({
  name: z.string().min(1),
  ranges: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
});

export const createPppoeProfileSchema = z.object({
  name: z.string().min(1),
  localAddress: z.string().optional(),
  remoteAddress: z.string().optional(),
  rateLimitMbps: z.number().int().positive().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const createHotspotProfileSchema = z.object({
  name: z.string().min(1),
  keepaliveTimeout: z.number().int().positive().optional(),
  maxSessions: z.number().int().positive().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const setSimulationSchema = z.object({
  offline: z.boolean().optional(),
  expiry: z.boolean().optional(),
});

export type ApplyProfileInput = z.infer<typeof applyProfileSchema>;
export type CreateRouterUserInput = z.infer<typeof createRouterUserSchema>;
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type EnrollRouterInput = z.infer<typeof enrollRouterSchema>;
export type DisconnectUserInput = z.infer<typeof disconnectUserSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type CreateQueueInput = z.infer<typeof createQueueSchema>;
export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type CreatePppoeProfileInput = z.infer<typeof createPppoeProfileSchema>;
export type CreateHotspotProfileInput = z.infer<typeof createHotspotProfileSchema>;
