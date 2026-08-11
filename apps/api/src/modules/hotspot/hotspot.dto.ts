import { z } from "zod";

export const redeemVoucherSchema = z.object({
  code: z.string().min(1).transform((value) => value.trim().toUpperCase()),
  deviceName: z.string().max(120).optional(),
});

export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>;
