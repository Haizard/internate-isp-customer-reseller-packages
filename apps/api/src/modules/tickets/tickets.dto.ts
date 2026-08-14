import { z } from "zod";

export const ticketStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]);
export const ticketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const ticketSourceSchema = z.enum(["CUSTOMER", "RESELLER", "SUPPORT", "SYSTEM"]);
export const ticketEntityTypeSchema = z.enum(["Customer", "Router", "Location", "Package", "Voucher"]);

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional(),
  priority: ticketPrioritySchema.default("MEDIUM"),
  entityType: ticketEntityTypeSchema.optional(),
  entityId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
});

export const addCommentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().default(false),
});

export const assignTicketSchema = z.object({
  assigneeId: z.string().nullable(),
});

export const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigneeId: z.string().optional(),
  entityType: ticketEntityTypeSchema.optional(),
  entityId: z.string().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
