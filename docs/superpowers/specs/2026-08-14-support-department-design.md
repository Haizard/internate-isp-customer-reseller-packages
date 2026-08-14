# NetMaster — Technical Support / Helpdesk Department (Design Spec)

- **Date:** 2026-08-14
- **Status:** Approved for implementation
- **Scope:** Add the first non-ISP-role department to NetMaster: a no-boundaries Technical Support / Helpdesk. Establish the reusable "department recipe" so future departments (Finance, NOC, Field Ops) are cheap to add.
- **Related docs:** `docs/project documentation/00-MVP_SCOPE.md`, `01-PROJECT_STRUCTURE.md`, `02-DATABASE_RULES.md`, `03-UI_DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DECISIONS.md`

## 1. Goal

Give the ISP an ISP-level support team that can see and act on tickets across all descendant orgs (resellers, locations, routers, customers) with no tenant boundaries for the support role. Tickets can reference any business entity. A customer can raise tickets from the customer portal. Future departments follow the same recipe.

## 2. Chosen approach

**Option A — Helpdesk as a first-class department** (approved over a config-driven framework and over extending `ServiceRequest` in place).

- Follow existing conventions exactly (5-file API module, route-group dashboard, design tokens).
- No new abstraction layer until a second department needs it (YAGNI).
- Cross-tenant visibility comes from the existing `tenantGuard` scope resolution, not new scoping code.

## 3. Data model

### 3.1 New enum values

- `UserRole.SUPPORT_AGENT` added to the Prisma `UserRole` enum and to `packages/types/src/index.ts`.

### 3.2 New model: `Ticket`

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | UUID |
| `subject` | `String` | |
| `description` | `String?` | |
| `status` | `enum TicketStatus` | `OPEN` / `IN_PROGRESS` / `PENDING_CUSTOMER` / `RESOLVED` / `CLOSED`, default `OPEN` |
| `priority` | `enum TicketPriority` | `LOW` / `MEDIUM` / `HIGH` / `URGENT`, default `MEDIUM` |
| `source` | `enum TicketSource` | `CUSTOMER` / `RESELLER` / `SUPPORT` / `SYSTEM` |
| `entityType` | `String?` | Polymorphic link: `Customer`, `Router`, `Location`, `Package`, `Voucher` |
| `entityId` | `String?` | UUID of the linked entity |
| `organizationId` | `String` | Owning org (the org whose tenant scope owns the linked entity) |
| `organization` | relation | `Organization` |
| `assigneeId` | `String?` | Support agent `User` |
| `assignee` | relation | `User` |
| `requesterId` | `String?` | User who raised it |
| `requester` | relation | `User` |
| `slaRespondBy` | `DateTime?` | Set on create (priority-driven) |
| `slaResolveBy` | `DateTime?` | Set on create |
| `firstResponseAt` | `DateTime?` | Set when first agent comment added |
| `resolvedAt` | `DateTime?` | |
| `closedAt` | `DateTime?` | |
| audit fields | `createdByUserId`, `updatedByUserId`, `createdAt`, `updatedAt`, `deletedAt` | |

Indexes: `[organizationId, status]`, `[assigneeId, status]`, `[entityType, entityId]`.

### 3.3 New model: `TicketComment`

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | UUID |
| `ticketId` | `String` | FK to `Ticket` |
| `ticket` | relation | |
| `authorId` | `String?` | |
| `authorRole` | `String` | Snapshot at write time (e.g. `CUSTOMER`, `SUPPORT_AGENT`) |
| `body` | `String` | |
| `isInternal` | `Boolean` | Default `false`; internal notes hidden from customer portal |
| `createdAt` | `DateTime` | |

Indexes: `[ticketId, createdAt]`.

Assignment history and status changes are recorded in the existing `AuditLog` (`entityType: "Ticket"`).

### 3.4 SLA rules (service config, not DB)

Priority-driven targets applied at create and assign time:

| Priority | Respond by | Resolve by |
|---|---|---|
| `URGENT` | 1h | 4h |
| `HIGH` | 4h | 24h |
| `MEDIUM` | 24h | 72h |
| `LOW` | 48h | 120h |

## 4. Backend API — `apps/api/src/modules/tickets/`

Standard 5-file module (`tickets.controller.ts`, `tickets.service.ts`, `tickets.routes.ts`, `tickets.dto.ts`, `tests/tickets.spec.ts`).

### 4.1 Routes (mounted at `/api/v1/tickets`)

- `GET /` — list, filters: `status`, `priority`, `assigneeId`, `entityType`, `entityId`, org scope (implied by `tenantGuard`)
- `POST /` — create (entity link optional)
- `GET /:id` — detail including comments
- `PATCH /:id` — update status/priority/assignee/entity
- `POST /:id/comments` — add comment (`isInternal` flag)
- `POST /:id/assign` — assign/reassign/unassign
- `GET /dashboard` — queue stats (open by priority, SLA-at-risk, my queue)

### 4.2 Access control

- Route-level: `SUPPORT_AGENT`, `ISP_ADMIN`, `PLATFORM_OWNER`.
- All module routes mount `authGuard` + `tenantGuard` first (same as existing modules).
- Customer self-service routes stay on `/customers/me/*`; `createRequest`/`listRequests` write to and read from `Ticket` (source=`CUSTOMER`) instead of `ServiceRequest`.
- Every service query scopes by `organizationId: { in: orgIds }` from `req.orgIds` (resolved by `tenantGuard`). No support role bypasses tenant scoping.

### 4.3 Validation (DTOs)

Zod schemas (consistent with existing modules): create/update/comment/assign payloads; valid `entityType` values enumerated; status/priority/source enums validated.

### 4.4 Errors

`AppError` with codes: 400 invalid entity/transition, 404 out-of-scope or missing, 409 invalid status transition. Consistent with `errorHandler`.

## 5. Frontend — `apps/web`

### 5.1 New route group `app/(support)/`

- `layout.tsx` — `AppShell`, items: Dashboard, Tickets, brand "NetMaster", `allowedRoles=["PLATFORM_OWNER","ISP_ADMIN","SUPPORT_AGENT"]`
- `dashboard/page.tsx` — queue overview: open tickets, priority breakdown, SLA-at-risk, my queue
- `tickets/page.tsx` — filterable list (status, priority, assignee, entity search)
- `tickets/[id]/page.tsx` — detail: conversation thread, internal/external notes, assign, status change, linked-entity card with navigation
- `tickets/new/page.tsx` — create ticket (link to any entity or standalone)

### 5.2 Auth plumbing

- `lib/auth.ts`: add `"SUPPORT_AGENT"` to `SessionUser` role union; `dashboardPathFor` returns `/support/dashboard`.
- `packages/types`: `UserRole` gains `SUPPORT_AGENT`.

### 5.3 Design system

- New accent token: iOS orange `#FF9F0A` ("accent-orange") registered in `packages/ui-tokens` and `styles/tokens.css`, following the existing role-color pattern.
- Reuse `Card`, `ListRow`, `StatusBadge`, `StatCard`, `PageHeader`, `States`, `Icon`; add one `PriorityBadge` variant if needed.
- No new UI primitives otherwise; adhere to glassmorphism design system.

### 5.4 Customer portal

- Extend `app/customer/` requests area to submit a support ticket and see status + agent replies (replacing the bare `ServiceRequest` list with a real ticket view).

## 6. Migration & seed

- One Prisma migration: add `SUPPORT_AGENT` enum value, `Ticket`, `TicketComment`.
- Update `apps/api/prisma/seed.ts` with demo tickets (open/urgent/SLA-at-risk/etc.) so the dashboard is populated.

## 7. Testing

- Unit tests `tests/tickets.spec.ts` covering: create with SLA targets, status transitions, assign/unassign, entity link validation, internal-vs-external comment rules, tenant-scope enforcement (out-of-scope ticket returns 404).
- Runs under existing vitest setup (`apps/api/vitest.config.ts`).

## 8. Expandability recipe

- Add `docs/project documentation/06-DEPARTMENTS.md` documenting the recipe: add role enum → API module (5-file) → route group → nav layout → accent token → `dashboardPathFor` → tests.
- Future departments (Finance, NOC, Field Ops) follow this playbook; no new framework until the second department arrives.

## 9. Non-goals (this iteration)

- No config-driven department registry / permission matrix.
- No notifications (email/SMS) — SLA timers are computed and shown, not actively pushed.
- No real payment / router enforcement changes.
- No SLA policy UI — targets are service constants.
