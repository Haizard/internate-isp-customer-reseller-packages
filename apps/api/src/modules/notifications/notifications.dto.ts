import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

export const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  all: z.boolean().optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
