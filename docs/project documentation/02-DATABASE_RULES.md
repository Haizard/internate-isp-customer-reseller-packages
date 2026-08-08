# Database Structure & Rules

## 1. Core Rules (apply to every table, no exceptions)
1. **Primary key:** `id UUID DEFAULT gen_random_uuid()` — never auto-increment int, so IDs are
   safe to expose and safe across future multi-region sharding.
2. **Tenant scoping:** every table except global lookup tables (`packages` templates owned by an
   ISP are fine, but truly global tables like `roles`) must carry `organization_id` and every
   query must filter by it. No cross-tenant query is ever written without an explicit,
   commented reason.
3. **Audit columns on every table:** `created_at`, `updated_at` (both `TIMESTAMPTZ DEFAULT now()`),
   `created_by_user_id`, `updated_by_user_id`.
4. **Soft delete:** use `deleted_at TIMESTAMPTZ NULL` instead of hard deletes on
   customer-facing and financial tables (`customers`, `vouchers`, `invoices`, `organizations`).
   Routers/locations may hard-delete in MVP if never linked to billing.
5. **Foreign keys are mandatory** — no "orphan" IDs stored without a real FK constraint.
6. **Enums as Postgres enum types** (not free-text strings) for: `organization_type`, `user_role`,
   `router_status`, `customer_status`, `voucher_status`.
7. **Money as integer (cents/lowest unit)**, never float. Currency stored alongside amount.
8. **Every write that changes state gets an audit_logs row** (actor, action, entity, entity_id,
   before/after JSON diff, timestamp).

## 2. Entity-Relationship Overview
```
Organization (ISP / RESELLER)
   1───* User
   1───* Location
              1───* Router
                        1───* Customer ───* Subscription ───1 Package
Organization (ISP) 1───* Package
Organization (RESELLER) 1───* Voucher
Customer 1───* Device
Customer 1───* UsageRecord
* AuditLog (polymorphic: entity_type + entity_id)
```
`Organization.parent_org_id` self-references so a `RESELLER` org points at its `ISP` org — this
is the single relationship that encodes the whole hierarchy, so it must never be modeled as a
separate join table.

## 3. Core Tables (Prisma schema — MVP)
```prisma
enum OrganizationType {
  ISP
  RESELLER
}

enum UserRole {
  PLATFORM_OWNER
  ISP_ADMIN
  RESELLER
  CUSTOMER
}

enum RouterStatus {
  ACTIVE
  OFFLINE
  SUSPENDED
}

enum CustomerStatus {
  ACTIVE
  SUSPENDED
  PENDING
}

enum VoucherStatus {
  UNUSED
  USED
  EXPIRED
}

model Organization {
  id            String            @id @default(uuid())
  name          String
  type          OrganizationType
  parentOrgId   String?
  parentOrg     Organization?     @relation("OrgHierarchy", fields: [parentOrgId], references: [id])
  children      Organization[]    @relation("OrgHierarchy")
  status        String            @default("ACTIVE") // ACTIVE | SUSPENDED | PENDING_APPROVAL

  users         User[]
  locations     Location[]
  packages      Package[]
  vouchers      Voucher[]

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  deletedAt     DateTime?
}

model User {
  id             String        @id @default(uuid())
  name           String
  email          String        @unique
  passwordHash   String
  role           UserRole
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model Location {
  id             String        @id @default(uuid())
  name           String
  address        String?
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
  routers        Router[]

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model Router {
  id           String        @id @default(uuid())
  name         String
  macAddress   String        @unique
  status       RouterStatus  @default(ACTIVE)
  locationId   String
  location     Location      @relation(fields: [locationId], references: [id])
  customers    Customer[]

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Package {
  id             String        @id @default(uuid())
  name           String
  speedMbps      Int
  dataCapGb      Int?          // null = unlimited
  priceCents     Int
  currency       String        @default("TZS")
  organizationId String        // owned by the ISP that created it
  organization   Organization  @relation(fields: [organizationId], references: [id])
  subscriptions  Subscription[]

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model Customer {
  id           String          @id @default(uuid())
  name         String
  phone        String
  wifiSsid     String?
  wifiPassword String?
  status       CustomerStatus  @default(ACTIVE)
  routerId     String
  router       Router          @relation(fields: [routerId], references: [id])
  subscription Subscription?
  devices      Device[]

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  deletedAt    DateTime?
}

model Subscription {
  id           String    @id @default(uuid())
  customerId   String    @unique
  customer     Customer  @relation(fields: [customerId], references: [id])
  packageId    String
  package      Package   @relation(fields: [packageId], references: [id])
  startedAt    DateTime  @default(now())
  renewsAt     DateTime?
}

model Voucher {
  id             String        @id @default(uuid())
  code           String        @unique
  organizationId String        // reseller org that generated it
  organization   Organization  @relation(fields: [organizationId], references: [id])
  dataGb         Int?
  durationHours  Int?
  status         VoucherStatus @default(UNUSED)
  usedByCustomerId String?
  expiresAt      DateTime?

  createdAt      DateTime      @default(now())
}

model Device {
  id          String    @id @default(uuid())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id])
  macAddress  String
  deviceName  String?
  lastSeenAt  DateTime?
}

model AuditLog {
  id           String    @id @default(uuid())
  actorUserId  String?
  action       String    // CREATE | UPDATE | DELETE | APPROVE | SUSPEND ...
  entityType   String
  entityId     String
  beforeJson   Json?
  afterJson    Json?
  createdAt    DateTime  @default(now())
}
```

## 4. Indexing Strategy (MVP minimum)
- `organization_id` indexed on every tenant-scoped table
- `email` unique index on `users`
- `mac_address` unique index on `routers` and non-unique on `devices`
- `code` unique index on `vouchers`
- Composite index `(organization_id, status)` on `customers` for dashboard filtering

## 5. Multi-Tenant Isolation Strategy for MVP
Application-level filtering (every Prisma query includes `organizationId: ctx.orgId` via a
shared query-builder helper), **not** Postgres Row-Level Security yet. RLS is a good Phase 2
hardening step once the schema is stable, but adding it now would slow down MVP iteration.

## 6. Migration Discipline
- One Prisma migration per PR, named descriptively (`add_voucher_table`, not `update1`)
- Never edit an already-applied migration file — create a new one
- Seed script (`prisma/seed.ts`) must create: 1 ISP org, 1 reseller org (child of it), 1 location,
  1 router, 2 packages, 3 customers, 5 vouchers — this is the standing demo dataset
