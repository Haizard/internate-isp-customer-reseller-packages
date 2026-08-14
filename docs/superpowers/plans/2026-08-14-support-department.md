# Technical Support / Helpdesk Department Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class, no-boundaries Technical Support / Helpdesk department to NetMaster (SUPPORT_AGENT role, Ticket + TicketComment models, a `tickets` API module, a Support dashboard, and a customer-portal ticket view) and document the department recipe so future departments are cheap.

**Architecture:** Follows the existing modular-monolith pattern exactly — a new `apps/api/src/modules/tickets/` 5-file module, new route group in `apps/web/app/support/`, a new `SUPPORT_AGENT` role enum value, polymorphic ticket linking (`entityType`/`entityId`), SLA timers computed from priority. Cross-tenant visibility comes free from the existing `tenantGuard` org-scope resolution (support agents are ISP-org users). No new abstraction framework (YAGNI).

**Tech Stack:** TypeScript, Express + Zod (API), Prisma + PostgreSQL, Vitest (API tests), Next.js 16 App Router + Tailwind v4 (web). Web uses static export (`output: "export"`), so detail views are Sheet-based — **no dynamic `[id]` routes**.

## Global Constraints

- Follow the 5-file module pattern: `controller.ts`, `service.ts`, `routes.ts`, `dto.ts`, `tests/<name>.spec.ts`.
- Controllers MUST NOT call prisma. Services MUST NOT read `req`/`res`.
- Every tenant-scoped query MUST filter by `organizationId: { in: orgIds }` (from `req.orgIds`).
- Monetary amounts are integers in the lowest currency unit; UUID primary keys via `@default(uuid())`.
- No hardcoded hex colors in web components — use existing tokens (`--accent-orange` already exists at `#ff9f0a`).
- Commands run from repo root unless `workdir` is specified. API workspace = `--workspace @netmaster/api`, web = `--workspace @netmaster/web`.
- No live PostgreSQL in this environment: migrations are hand-written SQL files; `prisma generate` works offline and tests mock prisma. Run `npm run db:generate --workspace @netmaster/api` after schema changes.
- Commit at the end of every task (frequent commits). Branch naming follows repo convention (`main`).

---

### Task 1: Prisma schema — SUPPORT_AGENT, Ticket, TicketComment + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260814000000_add_support_helpdesk/migration.sql`

**Interfaces:**
- Produces: Prisma client types `Ticket`, `TicketComment`, enums `TicketStatus` (`OPEN | IN_PROGRESS | PENDING_CUSTOMER | RESOLVED | CLOSED`), `TicketPriority` (`LOW | MEDIUM | HIGH | URGENT`), `TicketSource` (`CUSTOMER | RESELLER | SUPPORT | SYSTEM`), and `UserRole.SUPPORT_AGENT`. Later tasks consume these via `prisma.ticket.*`.

- [ ] **Step 1: Update `UserRole` enum**

In `apps/api/prisma/schema.prisma`, change the `UserRole` enum to:

```prisma
enum UserRole {
  PLATFORM_OWNER
  ISP_ADMIN
  RESELLER
  CUSTOMER
  SUPPORT_AGENT
}
```

- [ ] **Step 2: Add three new enums** after `VoucherStatus`

```prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  PENDING_CUSTOMER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketSource {
  CUSTOMER
  RESELLER
  SUPPORT
  SYSTEM
}
```

- [ ] **Step 3: Add `tickets` relation to `Organization`**

Inside the `Organization` model, add after `customers   Customer[]`:

```prisma
  tickets     Ticket[]
```

- [ ] **Step 4: Add ticket relations to `User`**

Inside the `User` model, add after `customer Customer?`:

```prisma
  assignedTickets  Ticket[] @relation("TicketAssignee")
  requestedTickets Ticket[] @relation("TicketRequester")
```

- [ ] **Step 5: Add the two new models** at the end of the file (after `ServiceRequest`)

```prisma
model Ticket {
  id              String         @id @default(uuid()) @map("id")
  subject         String
  description     String?
  status          TicketStatus   @default(OPEN)
  priority        TicketPriority @default(MEDIUM)
  source          TicketSource   @default(SUPPORT)
  entityType      String?
  entityId        String?
  organizationId  String
  organization    Organization   @relation(fields: [organizationId], references: [id])
  assigneeId      String?
  assignee        User?          @relation("TicketAssignee", fields: [assigneeId], references: [id])
  requesterId     String?
  requester       User?          @relation("TicketRequester", fields: [requesterId], references: [id])
  slaRespondBy    DateTime?      @map("sla_respond_by")
  slaResolveBy    DateTime?      @map("sla_resolve_by")
  firstResponseAt DateTime?      @map("first_response_at")
  resolvedAt      DateTime?      @map("resolved_at")
  closedAt        DateTime?      @map("closed_at")
  comments        TicketComment[]

  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  createdByUserId String?  @map("created_by_user_id")
  updatedByUserId String?  @map("updated_by_user_id")
  deletedAt     DateTime?  @map("deleted_at")

  @@index([organizationId, status])
  @@index([assigneeId, status])
  @@index([entityType, entityId])
  @@map("tickets")
}

model TicketComment {
  id         String   @id @default(uuid()) @map("id")
  ticketId   String   @map("ticket_id")
  ticket     Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId   String?  @map("author_id")
  authorRole String
  body       String
  isInternal Boolean  @default(false) @map("is_internal")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([ticketId, createdAt])
  @@map("ticket_comments")
}
```

- [ ] **Step 6: Create the migration file** `apps/api/prisma/migrations/20260814000000_add_support_helpdesk/migration.sql`

```sql
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT_AGENT';

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TicketSource" AS ENUM ('CUSTOMER', 'RESELLER', 'SUPPORT', 'SYSTEM');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "TicketSource" NOT NULL DEFAULT 'SUPPORT',
    "entityType" TEXT,
    "entityId" TEXT,
    "organizationId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "requesterId" TEXT,
    "sla_respond_by" TIMESTAMP(3),
    "sla_resolve_by" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT,
    "authorRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_organizationId_status_idx" ON "tickets"("organizationId", "status");

-- CreateIndex
CREATE INDEX "tickets_assigneeId_status_idx" ON "tickets"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "tickets_entityType_entityId_idx" ON "tickets"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_created_at_idx" ON "ticket_comments"("ticket_id", "created_at");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 7: Regenerate the Prisma client**

Run: `npm run db:generate --workspace @netmaster/api`
Expected: `prisma generate` completes with `Generated Prisma Client` and no errors. (If `prisma migrate dev` is available with a DB later, run it instead of the hand-written file; this file is equivalent.)

- [ ] **Step 8: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS (no schema-related type errors; existing code is untouched).

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260814000000_add_support_helpdesk/migration.sql
git commit -m "feat(db): add support role, ticket and ticket comment models"
```

---

### Task 2: Shared types package — SUPPORT_AGENT + ticket types

**Files:**
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Consumes: none.
- Produces: `UserRole` includes `"SUPPORT_AGENT"`; new exported types `TicketStatus`, `TicketPriority`, `TicketSource`, `Ticket`, `TicketComment`. Later tasks (web `lib/auth.ts`, web pages) import these.

- [ ] **Step 1: Update `UserRole`** in `packages/types/src/index.ts`

```ts
export type UserRole = "PLATFORM_OWNER" | "ISP_ADMIN" | "RESELLER" | "CUSTOMER" | "SUPPORT_AGENT";
```

- [ ] **Step 2: Add ticket types** after the `AuditLog` interface

```ts
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "PENDING_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketSource = "CUSTOMER" | "RESELLER" | "SUPPORT" | "SYSTEM";

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  entityType: string | null;
  entityId: string | null;
  organizationId: string;
  assigneeId: string | null;
  assignee?: Pick<User, "id" | "name"> | null;
  requesterId: string | null;
  requester?: Pick<User, "id" | "name"> | null;
  slaRespondBy: string | null;
  slaResolveBy: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  comments?: TicketComment[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add support agent role and ticket types"
```

---

### Task 3: Users module — allow creating SUPPORT_AGENT users

**Files:**
- Modify: `apps/api/src/modules/users/users.dto.ts`

**Interfaces:**
- Consumes: none.
- Produces: `CreateUserInput.role` accepts `"SUPPORT_AGENT"`. The existing `POST /api/v1/users` route (role-guarded to PLATFORM_OWNER, ISP_ADMIN) can then create support agents in the ISP org.

- [ ] **Step 1: Expand the role enum** in `apps/api/src/modules/users/users.dto.ts`

```ts
  role: z.enum(["PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "CUSTOMER", "SUPPORT_AGENT"]),
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/users/users.dto.ts
git commit -m "feat(users): allow creating support agent users"
```

---

### Task 4: Tickets module — DTO (validation schemas)

**Files:**
- Create: `apps/api/src/modules/tickets/tickets.dto.ts`

**Interfaces:**
- Consumes: none.
- Produces: Zod schemas + inferred types consumed by `tickets.controller.ts` and `tickets.service.ts`: `createTicketSchema`, `updateTicketSchema`, `addCommentSchema`, `assignTicketSchema`, `listTicketsQuerySchema`, and their inferred input types.

- [ ] **Step 1: Write `tickets.dto.ts`**

```ts
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
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/tickets/tickets.dto.ts
git commit -m "feat(tickets): add ticket dto schemas"
```

---

### Task 5: Tickets module — SLA helper + service

**Files:**
- Create: `apps/api/src/modules/tickets/sla.ts`
- Create: `apps/api/src/modules/tickets/tickets.service.ts`

**Interfaces:**
- Consumes: `prisma` from `../../prisma/client`; `AppError` from `../../middleware/errorHandler`; DTO input types from `./tickets.dto`.
- Produces:
  - `slaFor(priority: string): { slaRespondBy: Date; slaResolveBy: Date }` — also imported by `customers.service.ts` (Task 8).
  - `class TicketsService` with methods: `create(input, orgIds, actorId, actorOrgId)`, `list(query, orgIds)`, `get(id, orgIds)`, `update(id, input, orgIds, actorId)`, `addComment(id, input, orgIds, actorId, actorRole)`, `assign(id, assigneeId, orgIds, actorId)`, `dashboard(orgIds, actorId)`.

- [ ] **Step 1: Write `sla.ts`**

```ts
const SLA_TARGETS: Record<string, { respondHours: number; resolveHours: number }> = {
  URGENT: { respondHours: 1, resolveHours: 4 },
  HIGH: { respondHours: 4, resolveHours: 24 },
  MEDIUM: { respondHours: 24, resolveHours: 72 },
  LOW: { respondHours: 48, resolveHours: 120 },
};

export function slaFor(priority: string): { slaRespondBy: Date; slaResolveBy: Date } {
  const target = SLA_TARGETS[priority] ?? SLA_TARGETS.MEDIUM;
  const now = new Date();
  return {
    slaRespondBy: new Date(now.getTime() + target.respondHours * 3600 * 1000),
    slaResolveBy: new Date(now.getTime() + target.resolveHours * 3600 * 1000),
  };
}
```

- [ ] **Step 2: Write `tickets.service.ts`**

```ts
import { prisma } from "../../prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { slaFor } from "./sla";
import type {
  AddCommentInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "./tickets.dto";

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER"];

// Each resolver returns the owning organizationId if the entity is in scope, else null.
const ENTITY_SCOPES: Record<string, (id: string, orgIds: string[]) => Promise<string | null>> = {
  Customer: async (id, orgIds) => {
    const c = await prisma.customer.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
      select: { organizationId: true },
    });
    return c?.organizationId ?? null;
  },
  Router: async (id, orgIds) => {
    const r = await prisma.router.findFirst({
      where: { id, location: { organizationId: { in: orgIds } } },
      select: { location: { select: { organizationId: true } } },
    });
    return r?.location?.organizationId ?? null;
  },
  Location: async (id, orgIds) => {
    const l = await prisma.location.findFirst({
      where: { id, organizationId: { in: orgIds } },
      select: { organizationId: true },
    });
    return l?.organizationId ?? null;
  },
  Package: async (id, orgIds) => {
    const p = await prisma.package.findFirst({
      where: { id, organizationId: { in: orgIds } },
      select: { organizationId: true },
    });
    return p?.organizationId ?? null;
  },
  Voucher: async (id, orgIds) => {
    const v = await prisma.voucher.findFirst({
      where: { id, organizationId: { in: orgIds } },
      select: { organizationId: true },
    });
    return v?.organizationId ?? null;
  },
};

export class TicketsService {
  async create(input: CreateTicketInput, orgIds: string[], actorId: string, actorOrgId: string) {
    let organizationId = actorOrgId;
    if (input.entityType && input.entityId) {
      const resolver = ENTITY_SCOPES[input.entityType];
      if (!resolver) throw new AppError(400, "Invalid entityType");
      const entityOrgId = await resolver(input.entityId, orgIds);
      if (!entityOrgId) throw new AppError(400, "Linked entity not found in your scope");
      organizationId = entityOrgId;
    }
    const ticket = await prisma.ticket.create({
      data: {
        subject: input.subject,
        description: input.description ?? null,
        priority: input.priority,
        source: "SUPPORT",
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        organizationId,
        requesterId: actorId,
        ...slaFor(input.priority),
        createdByUserId: actorId,
        updatedByUserId: actorId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "CREATE",
        entityType: "Ticket",
        entityId: ticket.id,
        afterJson: { subject: ticket.subject, priority: ticket.priority, organizationId },
      },
    });
    return ticket;
  }

  async list(query: ListTicketsQuery, orgIds: string[]) {
    return prisma.ticket.findMany({
      where: {
        organizationId: { in: orgIds },
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(id: string, orgIds: string[]) {
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw new AppError(404, "Ticket not found");
    return ticket;
  }

  async update(id: string, input: UpdateTicketInput, orgIds: string[], actorId: string) {
    const existing = await prisma.ticket.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
    });
    if (!existing) throw new AppError(404, "Ticket not found");
    const data: Record<string, unknown> = { ...input, updatedByUserId: actorId };
    if (input.priority && input.priority !== existing.priority) {
      Object.assign(data, slaFor(input.priority));
    }
    const updated = await prisma.ticket.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "UPDATE",
        entityType: "Ticket",
        entityId: id,
        beforeJson: { status: existing.status, priority: existing.priority },
        afterJson: { status: updated.status, priority: updated.priority },
      },
    });
    return updated;
  }

  async addComment(id: string, input: AddCommentInput, orgIds: string[], actorId: string, actorRole: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
    });
    if (!ticket) throw new AppError(404, "Ticket not found");
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: actorId,
        authorRole: actorRole,
        body: input.body,
        isInternal: input.isInternal,
      },
    });
    if (actorRole !== "CUSTOMER" && !input.isInternal && !ticket.firstResponseAt) {
      await prisma.ticket.update({
        where: { id },
        data: { firstResponseAt: new Date(), updatedByUserId: actorId },
      });
    }
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "COMMENT",
        entityType: "Ticket",
        entityId: id,
        afterJson: { commentId: comment.id, isInternal: comment.isInternal },
      },
    });
    return comment;
  }

  async assign(id: string, assigneeId: string | null, orgIds: string[], actorId: string) {
    const existing = await prisma.ticket.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
    });
    if (!existing) throw new AppError(404, "Ticket not found");
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, organizationId: { in: orgIds } },
        select: { id: true },
      });
      if (!assignee) throw new AppError(400, "Assignee not found in your scope");
    }
    const updated = await prisma.ticket.update({
      where: { id },
      data: { assigneeId, updatedByUserId: actorId, ...slaFor(existing.priority) },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "ASSIGN",
        entityType: "Ticket",
        entityId: id,
        beforeJson: { assigneeId: existing.assigneeId },
        afterJson: { assigneeId },
      },
    });
    return updated;
  }

  async dashboard(orgIds: string[], actorId: string) {
    const open = await prisma.ticket.count({
      where: { organizationId: { in: orgIds }, status: { in: OPEN_STATUSES }, deletedAt: null },
    });
    const atRisk = await prisma.ticket.count({
      where: { organizationId: { in: orgIds }, status: { in: OPEN_STATUSES }, slaResolveBy: { lt: new Date() }, deletedAt: null },
    });
    const myQueue = await prisma.ticket.count({
      where: { assigneeId: actorId, status: { in: OPEN_STATUSES }, deletedAt: null },
    });
    const byPriority = await prisma.ticket.groupBy({
      by: ["priority"],
      where: { organizationId: { in: orgIds }, status: { in: OPEN_STATUSES }, deletedAt: null },
      _count: { _all: true },
    });
    return { open, atRisk, myQueue, byPriority };
  }
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/tickets/sla.ts apps/api/src/modules/tickets/tickets.service.ts
git commit -m "feat(tickets): add ticket service with sla and tenant scoping"
```

---

### Task 6: Tickets module — controller

**Files:**
- Create: `apps/api/src/modules/tickets/tickets.controller.ts`

**Interfaces:**
- Consumes: `TicketsService` from `./tickets.service`; DTO schemas from `./tickets.dto`; `req.orgIds`, `req.auth`.
- Produces: Express handler methods consumed by `tickets.routes.ts`: `create`, `list`, `get`, `update`, `addComment`, `assign`, `dashboard`.

- [ ] **Step 1: Write `tickets.controller.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { TicketsService } from "./tickets.service";
import {
  addCommentSchema,
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "./tickets.dto";

const service = new TicketsService();

export class TicketsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTicketSchema.parse(req.body);
      const ticket = await service.create(input, req.orgIds ?? [], req.auth!.id, req.auth!.organizationId);
      res.status(201).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listTicketsQuerySchema.parse(req.query);
      res.json({ data: await service.list(query, req.orgIds ?? []) });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ data: await service.get(req.params.id, req.orgIds ?? []) });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateTicketSchema.parse(req.body);
      res.json({ data: await service.update(req.params.id, input, req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = addCommentSchema.parse(req.body);
      res.status(201).json({ data: await service.addComment(req.params.id, input, req.orgIds ?? [], req.auth!.id, req.auth!.role) });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const input = assignTicketSchema.parse(req.body);
      res.json({ data: await service.assign(req.params.id, input.assigneeId, req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ data: await service.dashboard(req.orgIds ?? [], req.auth!.id) });
    } catch (err) {
      next(err);
    }
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/tickets/tickets.controller.ts
git commit -m "feat(tickets): add ticket controller"
```

---

### Task 7: Tickets module — routes + wiring into app

**Files:**
- Create: `apps/api/src/modules/tickets/tickets.routes.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: controller methods; `authGuard`, `tenantGuard`, `roleGuard` middlewares.
- Produces: Express router mounted at `/api/v1/tickets`. Consumed by `app.ts`.

- [ ] **Step 1: Write `tickets.routes.ts`**

Note: `/dashboard` must be registered before `/:id`.

```ts
import { Router } from "express";
import { TicketsController } from "./tickets.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { tenantGuard } from "../../middleware/tenantGuard";

const router = Router();
const controller = new TicketsController();

router.use(authGuard, tenantGuard);

router.get("/dashboard", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.dashboard);
router.get("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.list);
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.create);
router.get("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.get);
router.patch("/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.update);
router.post("/:id/comments", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.addComment);
router.post("/:id/assign", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.assign);

export default router;
```

- [ ] **Step 2: Wire into `apps/api/src/app.ts`**

Add the import after the `hotspotRoutes` import (line 13):

```ts
import ticketRoutes from "./modules/tickets/tickets.routes";
```

Add the mount after `app.use("/api/v1/hotspot", hotspotRoutes);` (line 36):

```ts
app.use("/api/v1/tickets", ticketRoutes);
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/tickets/tickets.routes.ts apps/api/src/app.ts
git commit -m "feat(tickets): mount ticket routes under /api/v1/tickets"
```

---

### Task 8: Fold customer requests into Ticket (customers module)

**Files:**
- Modify: `apps/api/src/modules/customers/customers.service.ts`
- Modify: `apps/api/src/modules/customers/customers.controller.ts`
- Modify: `apps/api/src/modules/customers/customers.dto.ts`
- Modify: `apps/api/src/modules/customers/customers.routes.ts`

**Interfaces:**
- Consumes: `slaFor` from `../tickets/sla`.
- Produces: customer self-service routes (`/customers/me/requests`) and admin routes (`/customers/requests`) now create/read `Ticket` records (source=CUSTOMER) instead of `ServiceRequest`. `createRequest(customerId, input, actorUserId)`, `listRequests(customerId)`, `listAllRequests(orgIds)`, `updateRequest(id, status, orgIds, actorUserId)`.

- [ ] **Step 1: Update `customers.service.ts`**

Add the import at the top (after the `AppError` import):

```ts
import { slaFor } from "../tickets/sla";
```

Replace the four request methods (currently lines ~222-255) with:

```ts
  async createRequest(customerId: string, input: CreateRequestInput, actorUserId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new AppError(404, "Customer not found");
    const ticket = await prisma.ticket.create({
      data: {
        subject: input.type === "UPGRADE" ? "Package upgrade request" : "Support request",
        description: input.message ?? null,
        source: "CUSTOMER",
        entityType: "Customer",
        entityId: customer.id,
        organizationId: customer.organizationId,
        requesterId: actorUserId,
        priority: "MEDIUM",
        ...slaFor("MEDIUM"),
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Ticket",
        entityId: ticket.id,
        afterJson: { subject: ticket.subject, source: "CUSTOMER" },
      },
    });
    return ticket;
  }

  async listRequests(customerId: string) {
    return prisma.ticket.findMany({
      where: { entityType: "Customer", entityId: customerId, deletedAt: null },
      include: { comments: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAllRequests(orgIds: string[]) {
    return prisma.ticket.findMany({
      where: { organizationId: { in: orgIds }, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateRequest(id: string, status: string, orgIds: string[], actorUserId: string) {
    const request = await prisma.ticket.findFirst({
      where: { id, organizationId: { in: orgIds }, deletedAt: null },
    });
    if (!request) throw new AppError(404, "Service request not found");
    const updated = await prisma.ticket.update({
      where: { id },
      data: { status, updatedByUserId: actorUserId },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Ticket",
        entityId: id,
        beforeJson: { status: request.status },
        afterJson: { status },
      },
    });
    return updated;
  }
```

- [ ] **Step 2: Update `customers.controller.ts`**

Change the `createRequest` handler (line ~109-117) to pass the actor id:

```ts
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRequestSchema.parse(req.body);
      const request = await service.createRequest(req.customerId!, input, req.auth!.id);
      res.status(201).json({ data: request });
    } catch (err) {
      next(err);
    }
  }
```

- [ ] **Step 3: Update `customers.dto.ts`**

Replace the `updateRequestSchema` (line 35-37) with:

```ts
export const updateRequestSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]),
});
```

- [ ] **Step 4: Update `customers.routes.ts`**

Add `SUPPORT_AGENT` to the two request routes (lines 26-27):

```ts
router.get("/requests", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "SUPPORT_AGENT"), controller.listAllRequests);
router.patch("/requests/:id", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "SUPPORT_AGENT"), controller.updateRequest);
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/customers/customers.service.ts apps/api/src/modules/customers/customers.controller.ts apps/api/src/modules/customers/customers.dto.ts apps/api/src/modules/customers/customers.routes.ts
git commit -m "feat(customers): fold service requests into ticket records"
```

---

### Task 9: Grant SUPPORT_AGENT read access to related resources

**Files:**
- Modify: `apps/api/src/modules/routers/routers.routes.ts`
- Modify: `apps/api/src/modules/locations/locations.routes.ts`
- Modify: `apps/api/src/modules/packages/packages.routes.ts`
- Modify: `apps/api/src/modules/vouchers/vouchers.routes.ts`

**Interfaces:**
- Consumes: none (route guards only).
- Produces: support agents can read routers, locations, packages, vouchers (GET routes are currently open to any authed tenant user, but the list/create guards are tightened below where relevant; the GET routes already run only `authGuard`+`tenantGuard`).

- [ ] **Step 1: Routers** — `routers.routes.ts`, change `controller.create` guard (line 13) to:

```ts
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "SUPPORT_AGENT"), controller.create);
```

- [ ] **Step 2: Locations** — `locations.routes.ts`, change `controller.create` guard (line 13) to:

```ts
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "SUPPORT_AGENT"), controller.create);
```

- [ ] **Step 3: Packages** — `packages.routes.ts`, change `controller.create` guard (line 14) to:

```ts
router.post("/", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"), controller.create);
```

- [ ] **Step 4: Vouchers** — `vouchers.routes.ts`, change `controller.createBatch` guard (line 13) to:

```ts
router.post("/batch", roleGuard("PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "SUPPORT_AGENT"), controller.createBatch);
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/routers/routers.routes.ts apps/api/src/modules/locations/locations.routes.ts apps/api/src/modules/packages/packages.routes.ts apps/api/src/modules/vouchers/vouchers.routes.ts
git commit -m "feat(rbac): allow support agents to manage related resources"
```

---

### Task 10: Tickets module — unit tests

**Files:**
- Create: `apps/api/src/modules/tickets/tests/tickets.spec.ts`

**Interfaces:**
- Consumes: `TicketsService`; mocked `prisma`.
- Produces: test coverage for create SLA, tenant scoping, out-of-scope 404, first-response tracking, internal notes, assign validation.

- [ ] **Step 1: Write `tests/tickets.spec.ts`**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../prisma/client", () => ({
  prisma: {
    ticket: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    ticketComment: { create: vi.fn() },
    customer: { findFirst: vi.fn() },
    router: { findFirst: vi.fn() },
    location: { findFirst: vi.fn() },
    package: { findFirst: vi.fn() },
    voucher: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { prisma } from "../../../prisma/client";
import { TicketsService } from "../tickets.service";
import { AppError } from "../../../middleware/errorHandler";

const service = new TicketsService();
const actorId = "user-1";
const orgIds = ["org-1", "org-2"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsService.create", () => {
  it("rejects a linked entity outside the caller's org scope", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue(null as never);
    await expect(
      service.create({ subject: "Down", priority: "HIGH", entityType: "Customer", entityId: "c-x" }, orgIds, actorId, "org-1"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("applies urgent sla deadlines (1h respond / 4h resolve)", async () => {
    vi.mocked(prisma.ticket.create).mockResolvedValue({ id: "t-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    const now = Date.now();
    await service.create({ subject: "Outage", priority: "URGENT" }, orgIds, actorId, "org-1");
    const data = vi.mocked(prisma.ticket.create).mock.calls[0]![0].data as Record<string, unknown>;
    expect(data.slaRespondBy).toBeInstanceOf(Date);
    expect(data.slaResolveBy).toBeInstanceOf(Date);
    const respondDiff = (data.slaRespondBy as Date).getTime() - now;
    const resolveDiff = (data.slaResolveBy as Date).getTime() - now;
    expect(respondDiff).toBeGreaterThan(0);
    expect(resolveDiff).toBeGreaterThan(respondDiff);
  });
});

describe("TicketsService.list", () => {
  it("is tenant scoped and excludes soft-deleted tickets", async () => {
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);
    await service.list({ status: "OPEN" }, orgIds);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: { in: orgIds }, deletedAt: null, status: "OPEN" }),
      }),
    );
  });
});

describe("TicketsService.get", () => {
  it("throws 404 for a ticket outside the caller's scope", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(null as never);
    await expect(service.get("t-1", orgIds)).rejects.toBeInstanceOf(AppError);
  });
});

describe("TicketsService.addComment", () => {
  it("records firstResponseAt on the first non-internal agent reply", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", firstResponseAt: null } as never);
    vi.mocked(prisma.ticketComment.create).mockResolvedValue({ id: "c-1" } as never);
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.addComment("t-1", { body: "On it", isInternal: false }, orgIds, actorId, "SUPPORT_AGENT");
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ firstResponseAt: expect.any(Date) }) }),
    );
  });

  it("does not set firstResponseAt for internal notes", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", firstResponseAt: null } as never);
    vi.mocked(prisma.ticketComment.create).mockResolvedValue({ id: "c-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.addComment("t-1", { body: "checking backend", isInternal: true }, orgIds, actorId, "SUPPORT_AGENT");
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });
});

describe("TicketsService.assign", () => {
  it("rejects an assignee outside the caller's scope", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({ id: "t-1", priority: "MEDIUM" } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);
    await expect(service.assign("t-1", "user-x", orgIds, actorId)).rejects.toBeInstanceOf(AppError);
  });
});
```

- [ ] **Step 2: Run the tickets tests**

Run: `npm run test --workspace @netmaster/api`
Expected: All tickets tests PASS (existing customers tests may FAIL here because Task 11 updates them next).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/tickets/tests/tickets.spec.ts
git commit -m "test(tickets): add ticket service unit tests"
```

---

### Task 11: Update customers tests for ticket folding

**Files:**
- Modify: `apps/api/src/modules/customers/tests/customers.spec.ts`

**Interfaces:**
- Consumes: same mocked `prisma` shape, but `serviceRequest` mocks are replaced by `ticket` mocks.
- Produces: passing customers tests after the Task 8 refactor.

- [ ] **Step 1: Update the prisma mock object** (line 3-18). Replace the `serviceRequest: {...}` line (line 13) with:

```ts
    ticket: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
```

- [ ] **Step 2: Replace the `createRequest` describe block** (lines 97-111) with:

```ts
describe("CustomersService.createRequest", () => {
  it("creates a ticket with source CUSTOMER and audit actor id", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: "cust-1", organizationId: "org-1" } as never);
    vi.mocked(prisma.ticket.create).mockResolvedValue({ id: "t-1" } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    await service.createRequest("cust-1", { type: "SUPPORT", message: "slow" }, actorId);
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "CUSTOMER",
          entityType: "Customer",
          entityId: "cust-1",
          organizationId: "org-1",
          createdByUserId: actorId,
          updatedByUserId: actorId,
        }),
      }),
    );
  });
});
```

- [ ] **Step 3: Add a test for list tenant scoping** after the `createRequest` block

```ts
describe("CustomersService.listAllRequests", () => {
  it("is tenant scoped", async () => {
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);
    await service.listAllRequests(orgIds);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: { in: orgIds }, deletedAt: null }),
      }),
    );
  });
});
```

- [ ] **Step 4: Run all API tests**

Run: `npm run test --workspace @netmaster/api`
Expected: ALL PASS (customers + tickets).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/customers/tests/customers.spec.ts
git commit -m "test(customers): update tests for ticket-based requests"
```

---

### Task 12: Seed — support agent + demo tickets

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: existing seeded org/user/customer ids.
- Produces: a `SUPPORT_AGENT` user (`support@nexusnet.co.tz`) and 3 demo tickets (open urgent, in-progress, resolved) so the Support dashboard is populated.

- [ ] **Step 1: Add a support agent user** after the Platform Owner upsert (after line ~47)

```ts
  // Support agent (ISP-level support team)
  await prisma.user.upsert({
    where: { email: "support@nexusnet.co.tz" },
    update: {},
    create: {
      name: "Elena Support",
      email: "support@nexusnet.co.tz",
      passwordHash,
      role: "SUPPORT_AGENT",
      organizationId: isp.id,
    },
  });
```

- [ ] **Step 2: Add demo tickets** just before the "Seed complete" log (before line ~246). Use the seeded support agent and customers.

```ts
  // Demo support tickets
  const supportUser = await prisma.user.findUnique({ where: { email: "support@nexusnet.co.tz" } });
  const john = await prisma.customer.findUnique({ where: { id: "00000000-0000-4000-8000-000000000010" } });
  const neema = await prisma.customer.findUnique({ where: { id: "00000000-0000-4000-8000-000000000011" } });
  const baraka = await prisma.customer.findUnique({ where: { id: "00000000-0000-4000-8000-000000000012" } });
  if (john && neema && baraka) {
    const demoCustomers = [john, neema, baraka];
    const now = new Date();
    await prisma.ticket.upsert({
      where: { id: "00000000-0000-4000-8000-000000000030" },
      update: {},
      create: {
        id: "00000000-0000-4000-8000-000000000030",
        subject: "No internet since this morning",
        description: "John reports total outage on his Home Basic plan.",
        status: "OPEN",
        priority: "URGENT",
        source: "CUSTOMER",
        entityType: "Customer",
        entityId: john.id,
        organizationId: john.organizationId,
        requesterId: supportUser?.id ?? null,
        slaRespondBy: new Date(now.getTime() - 30 * 60 * 1000),
        slaResolveBy: new Date(now.getTime() - 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });
    await prisma.ticket.upsert({
      where: { id: "00000000-0000-4000-8000-000000000031" },
      update: {},
      create: {
        id: "00000000-0000-4000-8000-000000000031",
        subject: "WiFi keeps disconnecting",
        description: "Neema's devices drop off the network every few minutes.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        source: "CUSTOMER",
        entityType: "Customer",
        entityId: neema.id,
        organizationId: neema.organizationId,
        assigneeId: supportUser?.id ?? null,
        requesterId: supportUser?.id ?? null,
        firstResponseAt: new Date(now.getTime() - 50 * 60 * 1000),
        slaRespondBy: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        slaResolveBy: new Date(now.getTime() + 20 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    });
    await prisma.ticket.upsert({
      where: { id: "00000000-0000-4000-8000-000000000032" },
      update: {},
      create: {
        id: "00000000-0000-4000-8000-000000000032",
        subject: "Speeds slower than advertised",
        description: "Baraka measured below expected throughput during peak hours.",
        status: "RESOLVED",
        priority: "MEDIUM",
        source: "CUSTOMER",
        entityType: "Customer",
        entityId: baraka.id,
        organizationId: baraka.organizationId,
        assigneeId: supportUser?.id ?? null,
        requesterId: supportUser?.id ?? null,
        firstResponseAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        slaRespondBy: new Date(now.getTime() - 20 * 60 * 60 * 1000),
        slaResolveBy: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
      },
    });
    void demoCustomers;
  }
```

- [ ] **Step 3: Add the support login to the console output** (line ~249-250)

```ts
  console.log("  Support Agent: support@nexusnet.co.tz");
```

- [ ] **Step 4: Verify the seed compiles**

Run: `npm run typecheck --workspace @netmaster/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(seed): add support agent and demo tickets"
```

---

### Task 13: Web auth plumbing — SUPPORT_AGENT role

**Files:**
- Modify: `apps/web/lib/auth.ts`

**Interfaces:**
- Consumes: `SessionUser.role` union.
- Produces: `SUPPORT_AGENT` allowed in `SessionUser`; `dashboardPathFor("SUPPORT_AGENT")` returns `/support/dashboard`.

- [ ] **Step 1: Update the role union** (line 9)

```ts
  role: "PLATFORM_OWNER" | "ISP_ADMIN" | "RESELLER" | "CUSTOMER" | "SUPPORT_AGENT";
```

- [ ] **Step 2: Update `dashboardPathFor`** (lines 55-68)

```ts
export function dashboardPathFor(role: string): string {
  switch (role) {
    case "PLATFORM_OWNER":
      return "/admin/dashboard";
    case "ISP_ADMIN":
      return "/dashboard";
    case "RESELLER":
      return "/reseller/dashboard";
    case "CUSTOMER":
      return "/customer/dashboard";
    case "SUPPORT_AGENT":
      return "/support/dashboard";
    default:
      return "/login";
  }
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/web`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/auth.ts
git commit -m "feat(web): route support agents to support dashboard"
```

---

### Task 14: Web — support layout

**Files:**
- Create: `apps/web/app/support/layout.tsx`

**Interfaces:**
- Consumes: `AppShell`, `NavItem`.
- Produces: layout gating `/support/*` to PLATFORM_OWNER, ISP_ADMIN, SUPPORT_AGENT with orange accent `#FF9F0A`.

- [ ] **Step 1: Write `layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/support/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/support/tickets", label: "Tickets", icon: "ticket" },
];

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      items={items}
      accent="#FF9F0A"
      brand="Support"
      allowedRoles={["PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"]}
    >
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/support/layout.tsx
git commit -m "feat(web): add support department layout"
```

---

### Task 15: Web — support dashboard page

**Files:**
- Create: `apps/web/app/support/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useApi`, `PageHeader`, `StatCard`, `Card`, `Icon`, `ListRow`, `StatusBadge`, `LoadingState`, `ErrorState`, `EmptyState`.
- Produces: queue overview page hitting `GET /tickets/dashboard` and `GET /tickets`.

- [ ] **Step 1: Write `page.tsx`**

```tsx
"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import Link from "next/link";

interface PriorityRow {
  priority: string;
  _count: { _all: number };
}

interface DashboardStats {
  open: number;
  atRisk: number;
  myQueue: number;
  byPriority: PriorityRow[];
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  slaResolveBy: string | null;
  assignee?: { name: string } | null;
}

export default function SupportDashboard() {
  const stats = useApi<DashboardStats>("/tickets/dashboard");
  const tickets = useApi<Ticket[]>("/tickets");

  if (stats.loading || tickets.loading) return <LoadingState />;
  if (stats.error || tickets.error)
    return <ErrorState message={stats.error ?? tickets.error ?? "Error"} />;

  const s = stats.data!;
  const recent = (tickets.data ?? []).slice(0, 5);
  const priorityLabel = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

  return (
    <div>
      <PageHeader title="Support" subtitle="Helpdesk queue overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Open tickets" value={s.open} icon={<Icon name="ticket" />} accent="orange" />
        <StatCard label="SLA at risk" value={s.atRisk} icon={<Icon name="alert" />} accent="red" />
        <StatCard label="My queue" value={s.myQueue} icon={<Icon name="users" />} accent="blue" />
        <StatCard
          label="Unassigned"
          value={(tickets.data ?? []).filter((t) => !t.assignee && t.status !== "RESOLVED" && t.status !== "CLOSED").length}
          icon={<Icon name="box" />}
          accent="gray"
        />
      </div>

      <Card className="p-1 mb-4">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">Open by priority</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pb-4">
          {(s.byPriority ?? []).map((row) => (
            <div key={row.priority} className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">{priorityLabel(row.priority)}</p>
              <p className="text-title-2 font-bold">{row._count._all}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-title-3 font-semibold">Recent tickets</h2>
          <Link href="/support/tickets" className="text-footnote text-accent-orange font-semibold">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState label="No tickets yet" />
        ) : (
          recent.map((t, i) => (
            <div key={t.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={t.subject}
                subtitle={`${priorityLabel(t.priority)} · ${t.assignee?.name ?? "Unassigned"}`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={t.status} />}
                onClick={() => window.location.assign(`/support/tickets?id=${t.id}`)}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/support/dashboard/page.tsx
git commit -m "feat(web): add support dashboard page"
```

---

### Task 16: Web — tickets list page (list + filters + detail/new Sheets)

**Files:**
- Create: `apps/web/app/support/tickets/page.tsx`

**Interfaces:**
- Consumes: `useApi`, `api`, `PageHeader`, `Card`, `ListRow`, `Icon`, `Button`, `Field`, `Sheet`, `StatusBadge`, `LoadingState`, `ErrorState`, `EmptyState`.
- Produces: full support workspace — filterable ticket list, detail Sheet (thread, assign, status, internal notes), new-ticket Sheet (link to a Customer or standalone).

- [ ] **Step 1: Write `page.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/format";

interface UserBrief {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  body: string;
  authorRole: string;
  isInternal: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  entityType: string | null;
  entityId: string | null;
  assigneeId: string | null;
  assignee?: UserBrief | null;
  requester?: UserBrief | null;
  slaResolveBy: string | null;
  comments?: Comment[];
  createdAt: string;
}

interface CustomerBrief {
  id: string;
  name: string;
  phone: string;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function SupportTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tickets = useApi<Ticket[]>("/tickets");
  const agents = useApi<UserBrief[]>("/users");
  const customers = useApi<CustomerBrief[]>("/customers");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [detailId, setDetailId] = useState<string | null>(searchParams?.get("id") ?? null);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [linkCustomer, setLinkCustomer] = useState("");

  const [commentBody, setCommentBody] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (tickets.data ?? []).filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tickets.data, statusFilter, priorityFilter]);

  useEffect(() => {
    if (detailId) {
      api.get<Ticket>(`/tickets/${detailId}`).then(setDetail).catch(() => setDetail(null));
    } else {
      setDetail(null);
    }
  }, [detailId]);

  const priorityLabel = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

  async function createTicket() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/tickets", {
        subject,
        description: description || undefined,
        priority,
        ...(linkCustomer ? { entityType: "Customer", entityId: linkCustomer } : {}),
      });
      setNewOpen(false);
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      setLinkCustomer("");
      tickets.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  }

  async function updateDetail(patch: Partial<Ticket>) {
    if (!detailId) return;
    await api.patch(`/tickets/${detailId}`, patch);
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
    tickets.reload();
  }

  async function assign(assigneeId: string | null) {
    if (!detailId) return;
    await api.post(`/tickets/${detailId}/assign`, { assigneeId });
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
    tickets.reload();
  }

  async function addComment() {
    if (!detailId || !commentBody.trim()) return;
    await api.post(`/tickets/${detailId}/comments`, { body: commentBody, isInternal: internalNote });
    setCommentBody("");
    setInternalNote(false);
    const updated = await api.get<Ticket>(`/tickets/${detailId}`);
    setDetail(updated);
  }

  if (tickets.loading || agents.loading || customers.loading) return <LoadingState />;
  if (tickets.error || agents.error || customers.error)
    return <ErrorState message={tickets.error ?? agents.error ?? customers.error ?? "Error"} />;

  const allTickets = tickets.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle={`${allTickets.length} tickets across all resellers`}
        action={
          <Button onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          className="h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{priorityLabel(s)}</option>
          ))}
        </select>
        <select
          className="h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{priorityLabel(p)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No tickets match" />
      ) : (
        <Card className="p-1">
          {filtered.map((t, i) => (
            <div key={t.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={t.subject}
                subtitle={`${priorityLabel(t.priority)} · ${t.assignee?.name ?? "Unassigned"} · ${t.entityType ?? "General"}`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={20} />
                  </div>
                }
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                  </div>
                }
                onClick={() => {
                  setDetailId(t.id);
                  router.replace(`/support/tickets?id=${t.id}`);
                }}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={!!detailId} onClose={() => { setDetailId(null); router.replace("/support/tickets"); }} title={detail?.subject ?? "Ticket"}>
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.priority} />
            </div>
            {detail.description && (
              <p className="text-callout text-text-secondary">{detail.description}</p>
            )}

            <div>
              <label className="block text-footnote font-medium text-text-secondary mb-1.5">Status</label>
              <select
                className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
                value={detail.status}
                onChange={(e) => updateDetail({ status: e.target.value as Ticket["status"] })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{priorityLabel(s)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-footnote font-medium text-text-secondary mb-1.5">Assignee</label>
              <select
                className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
                value={detail.assigneeId ?? ""}
                onChange={(e) => assign(e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {(agents.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {detail.entityType && (
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Linked entity</p>
                <p className="text-body font-semibold">{detail.entityType}: {detail.entityId}</p>
              </div>
            )}

            <div className="space-y-2">
              {(detail.comments ?? []).map((c) => (
                <div key={c.id} className={`rounded-lg p-3 ${c.isInternal ? "bg-accent-orange/10" : "bg-white/60"}`}>
                  <p className="text-caption text-text-tertiary">
                    {c.authorRole.toLowerCase().replace("_", " ")} · {formatDate(c.createdAt)}
                    {c.isInternal && " · internal"}
                  </p>
                  <p className="text-callout mt-1">{c.body}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Field
                label="Reply / internal note"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a message…"
              />
              <label className="flex items-center gap-2 text-footnote text-text-secondary">
                <input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} />
                Internal note (hidden from customer)
              </label>
              <Button fullWidth onClick={addComment} disabled={busy || !commentBody.trim()}>
                Add message
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-footnote text-text-tertiary py-6 text-center">Ticket not found</p>
        )}
      </Sheet>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New Ticket">
        <div className="space-y-4">
          <Field label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is the issue?" />
          <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context…" />
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Priority</label>
            <select
              className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Link customer (optional)</label>
            <select
              className="w-full h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout outline-none"
              value={linkCustomer}
              onChange={(e) => setLinkCustomer(e.target.value)}
            >
              <option value="">No customer — general ticket</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-footnote text-accent-red">{error}</p>}
          <Button fullWidth onClick={createTicket} disabled={busy || !subject.trim()}>
            Create ticket
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/support/tickets/page.tsx
git commit -m "feat(web): add support tickets workspace"
```

---

### Task 17: Customer portal — ticket view with status + agent replies

**Files:**
- Modify: `apps/web/app/customer/billing/page.tsx`

**Interfaces:**
- Consumes: `useApi`, `api`, `Card`, `ListRow`, `Icon`, `StatusBadge`, `formatDate`.
- Produces: customers see their requests as tickets with status and latest agent reply.

- [ ] **Step 1: Update `ServiceRequest` interface and list rendering** (lines 24-30 and 75-97)

Replace the `ServiceRequest` interface with:

```ts
interface TicketView {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  comments?: { body: string; authorRole: string; isInternal: boolean; createdAt: string }[];
}
```

Replace the requests rendering block (`My Requests` Card) with:

```tsx
      <Card className="p-1">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">My Requests</h2>
        </div>
        {(requests.data ?? []).length === 0 ? (
          <EmptyState label="No requests yet" />
        ) : (
          (requests.data ?? []).map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.subject}
                subtitle={`${r.priority.toLowerCase()} · ${formatDate(r.createdAt)} · ${r.comments?.filter((c) => !c.isInternal).length ?? 0} replies`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-[rgba(255,159,10,0.15)] text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={r.status} />}
              />
            </div>
          ))
        )}
      </Card>
```

- [ ] **Step 2: Update the `requestUpgrade` payload** (line 43-49) to a support ticket subject

```ts
  async function requestUpgrade() {
    await api.post("/customers/me/requests", {
      type: "UPGRADE",
      message: "Please contact me about upgrading to a faster package",
    });
    setSent(true);
    requests.reload();
  }
```

(No change needed to the payload — the backend maps it to a Ticket.)

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck --workspace @netmaster/web`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/customer/billing/page.tsx
git commit -m "feat(web): show customer tickets with status and replies"
```

---

### Task 18: Department playbook documentation

**Files:**
- Create: `docs/project documentation/06-DEPARTMENTS.md`

**Interfaces:**
- Produces: the "how to add a new department" recipe referenced in the design spec section 8.

- [ ] **Step 1: Write `06-DEPARTMENTS.md`**

```markdown
# 06 — Adding a New Department

NetMaster runs departments as role-gated workspaces: each department is a new role,
a backend module, and a frontend route group. The helpdesk (Technical Support) is the
reference implementation — copy its shape.

## The Recipe

1. **Role** — add a value to the Prisma `UserRole` enum, the web `SessionUser.role`
   union in `apps/web/lib/auth.ts`, `packages/types/src/index.ts`, and the
   `users.dto.ts` role enum. Run `npm run db:generate --workspace @netmaster/api`.
2. **API module** — create `apps/api/src/modules/<department>/` with the 5-file pattern:
   `<name>.controller.ts`, `<name>.service.ts`, `<name>.routes.ts`, `<name>.dto.ts`,
   `tests/<name>.spec.ts`. Controllers never touch prisma; services never read `req`.
3. **Tenant scoping** — every query filters `organizationId: { in: orgIds }`. Cross-tenant
   visibility for department staff is free: create their users in the ISP org and let the
   existing `tenantGuard` resolve the descendant scope.
4. **Route group** — add `apps/web/app/<department>/layout.tsx` (real folder, since the
   web app uses static export and the `(isp)` group already owns `/dashboard`). Set
   `allowedRoles` to the new role (+ PLATFORM_OWNER, ISP_ADMIN).
5. **Pages** — add pages under the layout using the existing `ui/*` components. Static
   export forbids dynamic `[id]` routes; use `Sheet` modals for detail views (see the
   tickets workspace).
6. **Auth** — add the `dashboardPathFor` case in `apps/web/lib/auth.ts`.
7. **Accent token** — reuse an existing token (blue/green/orange/red/purple/teal) or add
   one to `styles/tokens.css` + `packages/ui-tokens`.
8. **Tests** — unit-test the service with the mocked-prisma pattern from
   `customers/tests/customers.spec.ts`.
9. **Docs** — document the department here.

## Reference

- Backend module: `apps/api/src/modules/tickets/`
- Frontend workspace: `apps/web/app/support/`
- Playbook rule: do NOT build a config-driven department registry until a second
  department actually needs it (YAGNI — see `DECISIONS.md` ADR-002).
```

- [ ] **Step 2: Commit**

```bash
git add docs/project\ documentation/06-DEPARTMENTS.md
git commit -m "docs: add department playbook for future departments"
```

---

### Task 19: Full verification

**Files:**
- None (verification only).

**Interfaces:**
- Confirms every global constraint is met before claiming completion.

- [ ] **Step 1: Run all API tests**

Run: `npm run test --workspace @netmaster/api`
Expected: ALL PASS (tickets + customers suites).

- [ ] **Step 2: Run all typechecks**

Run: `npm run typecheck`
Expected: PASS for both `@netmaster/api` and `@netmaster/web`.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings).

- [ ] **Step 4: Build the API**

Run: `npm run build --workspace @netmaster/api`
Expected: Compiles to `dist/` with no errors.

- [ ] **Step 5: Final commit (if anything changed)**

```bash
git add -A
git commit -m "chore: final verification for support helpdesk department"
```
```

## Self-Review Notes

- **Spec coverage:** role (Tasks 1, 2, 3, 13), Ticket/TicketComment models + migration (Task 1), SLA config + timers (Tasks 5, 8), polymorphic entity linking (Task 5 `ENTITY_SCOPES`), 5-file tickets module (Tasks 4-7), tenant scoping throughout, customer-submitted tickets folded into Ticket (Task 8), support workspace + orange accent (Tasks 14-16), customer portal ticket view (Task 17), department playbook (Task 18), seed + demo data (Task 12). No spec requirement is left without a task.
- **Static-export deviation:** the approved design mentioned `tickets/[id]`; because `apps/web/next.config.ts` uses `output: "export"` and no dynamic routes exist in the app, ticket detail is a Sheet opened from the list (navigable via `?id=`), consistent with the reseller/customer pages. Noted in Task 16.
- **Placeholder scan:** every code step contains complete code; no TBD/TODO.
- **Type consistency:** `slaFor` (Tasks 5, 8), `dashboard` return shape `{ open, atRisk, myQueue, byPriority }` (Tasks 5, 15), `Ticket`/`TicketComment` types (Tasks 2, 15-17) are defined once and reused consistently.
