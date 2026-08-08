import { z } from "zod";

export const createRouterSchema = z.object({
  name: z.string().min(1),
  macAddress: z.string().min(1),
  status: z.enum(["ACTIVE", "OFFLINE", "SUSPENDED"]).optional(),
  locationId: z.string().min(1),
});

export const updateRouterSchema = z.object({
  name: z.string().optional(),
  macAddress: z.string().optional(),
  status: z.enum(["ACTIVE", "OFFLINE", "SUSPENDED"]).optional(),
  locationId: z.string().optional(),
});

export type CreateRouterInput = z.infer<typeof createRouterSchema>;
export type UpdateRouterInput = z.infer<typeof updateRouterSchema>;
