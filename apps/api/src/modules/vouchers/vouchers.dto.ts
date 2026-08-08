import { z } from "zod";

export const createVoucherBatchSchema = z.object({
  count: z.number().int().min(1).max(100),
  dataGb: z.number().int().nonnegative().optional().nullable(),
  durationHours: z.number().int().nonnegative().optional().nullable(),
  expiresInDays: z.number().int().positive().optional(),
});

export type CreateVoucherBatchInput = z.infer<typeof createVoucherBatchSchema>;
