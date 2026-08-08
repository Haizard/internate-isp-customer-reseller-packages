# ARCHITECTURE.md — System Architecture & Non-Negotiables

## 1. High-Level Architecture Overview

NetMaster is structured as a **Cloud-Managed Network Platform**. In the MVP phase, it operates as a **Modular Monolith** running within a Turborepo monorepo, cleanly separating frontend, backend, and shared packages.

```
┌─────────────────────────────────────────────────────────────┐
│                 WEB DASHBOARD APP (apps/web)                │
│  Next.js 14+ (App Router) + TypeScript + Tailwind CSS       │
│  - (auth)     : Login / Register                            │
│  - (isp)      : ISP Admin Dashboard (Blue Theme #0A84FF)    │
│  - (reseller) : Reseller Dashboard (Purple Theme #BF5AF2)   │
│  - (customer) : Customer Portal (Teal Theme #40C8E0)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / HTTP (JSON + JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                  API BACKEND APP (apps/api)                 │
│  Node.js + Express / NestJS + TypeScript                    │
│  - Middleware: AuthGuard, RoleGuard, TenantScopeGuard        │
│  - Modules: Auth, Orgs, Users, Locations, Routers,          │
│            Customers, Packages, Vouchers, AuditLogs          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM (Type-Safe SQL)
┌──────────────────────────────▼──────────────────────────────┐
│                  DATABASE (PostgreSQL)                      │
│  - Multi-tenant data isolation via organizationId          │
│  - UUID Primary Keys & Hierarchical Parent-Child Orgs       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Non-Negotiables

1. **Fixed Organizational Hierarchy**:
   ```
   ISP (OrganizationType = ISP)
    └── Reseller (OrganizationType = RESELLER, parentOrgId = ISP.id)
         └── Location (Site / Shop / House / Block)
              └── Router (Physical or Simulated Gateway Device)
                   └── Customer (End-user assigned to Router & Package)
   ```
   This model handles 1 ISP / 1 Reseller / 1 Router up to 100 ISPs / 10,000 Resellers / 100,000 Routers without schema alterations.

2. **Strict Multi-Tenant Query Scoping**:
   - Every database table (except global lookup tables) contains an `organizationId` column.
   - All Prisma queries for tenant resources MUST automatically apply `where: { organizationId: ctx.orgId }`.
   - Cross-tenant data leakage is a critical security violation.

3. **Backend Modular Architecture**:
   - Every backend feature lives inside its dedicated module in `apps/api/src/modules/<name>/`.
   - Controllers handle HTTP parsing/response logic only.
   - Services contain pure business logic and Prisma interactions.
   - DTOs validate all inputs using Zod or Yup.

4. **UI Design System Guarantee**:
   - iOS-native light translucent canvas (`linear-gradient(160deg, #F6F8FC 0%, #ECEFF6 45%, #E7EBF5 100%)`).
   - Frosted glass containers (`background: rgba(255, 255, 255, 0.55)`, `backdrop-filter: blur(20px)`).
   - Dynamic responsiveness: Desktop (fixed left glass sidebar) vs Mobile (iOS bottom glass tab bar + iOS large title headers + 2-column `.card-grid`).

---

## 3. Communication Contracts

- **Client ↔ Server**: REST API endpoints under `/api/v1/`.
- **Authentication**: JWT Bearer token passed via Authorization header (`Authorization: Bearer <token>`).
- **Data Exchange**: All JSON payloads formatted in camelCase in JavaScript/TypeScript and converted to snake_case in PostgreSQL tables via Prisma mapping (`@map("column_name")`).
