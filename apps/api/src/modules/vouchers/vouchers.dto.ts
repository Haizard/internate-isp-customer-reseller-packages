import { z } from "zod";

export const createVoucherBatchSchema = z.object({
  count: z.number().int().min(1).max(100),
  dataGb: z.number().int().nonnegative().optional().nullable(),
  durationHours: z.number().int().nonnegative().optional().nullable(),
  expiresInDays: z.number().int().positive().optional(),
  locationId: z.string().optional().nullable(),
});

export const updateVoucherStatusSchema = z.object({
  status: z.enum(["UNUSED", "USED", "EXPIRED"]),
});

export type CreateVoucherBatchInput = z.infer<typeof createVoucherBatchSchema>;
export type UpdateVoucherStatusInput = z.infer<typeof updateVoucherStatusSchema>;
