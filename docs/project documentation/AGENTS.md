# AGENTS.md — AI Coding Agent Instructions & Guardrails

> **MANDATORY**: Any AI agent working in this codebase MUST read this file first, followed by `ARCHITECTURE.md`, `DECISIONS.md`, and the files in `docs/` in numerical order before reading or writing any code.

---

## 1. Project Identity & Philosophy
This repository contains the **NetMaster ISP & Customer Reseller System** — a multi-tenant cloud-managed network platform designed for ISPs, micro-resellers, and end customers.

- **Stack**: Monorepo with Turborepo, Next.js (React + TypeScript + Tailwind CSS), Node.js/Express (TypeScript), Prisma ORM, PostgreSQL.
- **Design System**: iOS-Native Light Glassmorphism canvas (`#F2F4F8`, `#F6F8FC` to `#E7EBF5` gradient).
- **Core Strategy**: Modular Monolith for MVP, strict tenant isolation via `organizationId`, UUID primary keys.

---

## 2. Mandatory Reading Sequence
Before taking any action, inspect and follow these documents in order:

1. [`AGENTS.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/AGENTS.md) (This file)
2. [`ARCHITECTURE.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/ARCHITECTURE.md) (System architecture & non-negotiables)
3. [`DECISIONS.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/DECISIONS.md) (Architectural Decision Records)
4. [`docs/00-MVP_SCOPE.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/docs/00-MVP_SCOPE.md) (Strict MVP scope boundaries)
5. [`docs/01-PROJECT_STRUCTURE.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/docs/01-PROJECT_STRUCTURE.md) (Repository, monorepo, & module pattern rules)
6. [`docs/02-DATABASE_RULES.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/docs/02-DATABASE_RULES.md) (Prisma schema, multi-tenancy, DB conventions)
7. [`docs/03-UI_DESIGN_SYSTEM.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/docs/03-UI_DESIGN_SYSTEM.md) (Design tokens, glassmorphism, colors, components)
8. [`docs/04-UI_STRUCTURE.md`](file:///c:/Users/haizard/Desktop/isp%20internate%20and%20customer%20reseller%20system/docs/04-UI_STRUCTURE.md) (Responsive breakpoints, page shells, card grids)

---

## 3. Strict Rules for AI Coding Agents

### Rule 1: Respect MVP Scope Boundries
- **NEVER** write code for deferred Phase 2+ features (on-device edge agents, real hardware flashing, RADIUS, real payment gateways, push notifications, AI analytics).
- Focus **exclusively** on features listed in `docs/00-MVP_SCOPE.md` §4.

### Rule 2: Multi-Tenancy & Security First
- Every Prisma query for tenant entities MUST filter by `organizationId`.
- Primary keys must always be `UUID` (`@default(uuid())`).
- Passwords MUST be hashed with `bcrypt`. JWT tokens must be signed securely.
- Role-based authorization MUST be enforced on the backend server (`middleware/authGuard.ts`, `middleware/roleGuard.ts`, `middleware/tenantGuard.ts`). Never rely on frontend hiding alone.

### Rule 3: Maintain Backend 5-File Module Pattern
Every module in `apps/api/src/modules/<name>/` MUST follow the 5-file pattern:
- `<name>.controller.ts` (HTTP request/response handling ONLY)
- `<name>.service.ts` (Business logic and Prisma queries ONLY)
- `<name>.routes.ts` (Express routing & middleware binding)
- `<name>.dto.ts` (Input validation schemas)
- `tests/<name>.spec.ts` (Unit/integration tests)

**Strict Prohibition**: Controllers MUST NOT call Prisma directly. Services MUST NOT touch `req` or `res`.

### Rule 4: UI Design System Adherence
- **Canvas**: Light glassmorphism (`--bg-gradient`), frosted glass cards (`backdrop-filter: blur(20px)`), white borders with low opacity, soft diffuse shadows.
- **NEVER** use dark gray/black full page backgrounds.
- **Role Colors**: ISP Admin = Blue (`#0A84FF`), Reseller = Purple (`#BF5AF2`), Customer = Teal (`#40C8E0`).
- **Responsive Layout**: Mobile (<768px) MUST use 2-column `.card-grid`, fixed bottom glass tab bar, and iOS large-title header. Desktop (≥1024px) MUST use a 260px fixed glass sidebar and top bar.
- Always use CSS tokens defined in `styles/tokens.css` or Tailwind theme variables. Never hardcode random hex values in components.

### Rule 5: Code Quality & Testing
- Write TypeScript with strict typing. Avoid `any`.
- All monetary amounts MUST be stored as integers in lowest currency unit (e.g. TZS integer amount).
- Use kebab-case for filenames, PascalCase for React components and Prisma models, snake_case for DB table names.
