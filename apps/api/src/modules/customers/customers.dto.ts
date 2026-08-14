import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  routerId: z.string().min(1),
  packageId: z.string().optional(),
  wifiSsid: z.string().optional().nullable(),
  wifiPassword: z.string().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]).optional(),
  routerId: z.string().optional(),
});

export const updateWifiSchema = z.object({
  wifiSsid: z.string().min(1),
  wifiPassword: z.string().min(1),
});

export const redeemVoucherSchema = z.object({
  code: z.string().min(1),
});

export const createRequestSchema = z.object({
  type: z.enum(["UPGRADE", "SUPPORT"]),
  message: z.string().optional(),
});

export const updateRequestSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdateWifiInput = z.infer<typeof updateWifiSchema>;
export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
