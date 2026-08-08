import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
