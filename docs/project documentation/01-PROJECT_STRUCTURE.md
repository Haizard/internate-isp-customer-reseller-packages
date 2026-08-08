# Project Structure

## 1. Stack Decision (MVP)
- **Frontend:** Next.js (React) + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express (or Nest.js) + TypeScript
- **ORM/DB:** Prisma + PostgreSQL
- **Auth:** JWT (access + refresh token), bcrypt for password hashing
- **Monorepo tool:** Turborepo (or plain npm workspaces if you want it simpler for MVP)

> Rust Gateway Agent, RADIUS, and other Phase 2+ pieces get their own repos later — do not
> scaffold them now.

## 2. Repository Layout
```
isp-platform/
├── apps/
│   ├── web/                     # Next.js frontend (all 3 dashboards, role-gated)
│   │   ├── app/                 # App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (isp)/           # ISP Admin routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── resellers/
│   │   │   │   ├── packages/
│   │   │   │   └── reports/
│   │   │   ├── (reseller)/      # Reseller routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── locations/
│   │   │   │   ├── routers/
│   │   │   │   ├── customers/
│   │   │   │   └── vouchers/
│   │   │   ├── (customer)/      # Customer portal routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── wifi/
│   │   │   │   ├── devices/
│   │   │   │   ├── usage/
│   │   │   │   └── billing/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/              # design-system primitives (Button, Card, Sheet, TabBar…)
│   │   │   ├── layout/          # Sidebar, TopBar, MobileTabBar, PageShell
│   │   │   ├── forms/           # form field wrappers
│   │   │   └── charts/
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tokens.css       # design tokens (colors, blur, radius, spacing)
│   │   ├── lib/                 # api client, auth helpers, hooks
│   │   └── public/
│   │
│   └── api/                     # Node/Express backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── organizations/
│       │   │   ├── users/
│       │   │   ├── locations/
│       │   │   ├── routers/
│       │   │   ├── customers/
│       │   │   ├── packages/
│       │   │   ├── vouchers/
│       │   │   └── reports/
│       │   │       # each module: controller.ts, service.ts, routes.ts, dto.ts, tests/
│       │   ├── middleware/      # auth guard, role guard, tenant-scope guard, error handler
│       │   ├── prisma/
│       │   │   ├── schema.prisma
│       │   │   └── migrations/
│       │   ├── config/
│       │   └── app.ts
│       └── tests/
│
├── packages/
│   ├── ui-tokens/                # shared design tokens (JSON) consumable by web + future mobile
│   ├── types/                    # shared TypeScript types/DTOs between web and api
│   └── config/                   # eslint, tsconfig, tailwind config presets
│
├── docs/                         # this documentation set
│   ├── 00-MVP_SCOPE.md
│   ├── 01-PROJECT_STRUCTURE.md
│   ├── 02-DATABASE_RULES.md
│   ├── 03-UI_DESIGN_SYSTEM.md
│   └── 04-UI_STRUCTURE.md
│
├── AGENTS.md                     # rules for any AI coding agent working in this repo
├── ARCHITECTURE.md               # high-level architecture that must not be violated
├── MVP_SCOPE.md -> docs/00-MVP_SCOPE.md
├── DECISIONS.md                  # log of major architecture decisions + why
├── docker-compose.yml            # postgres, redis (later)
├── turbo.json
└── package.json
```

## 3. Module Pattern (backend)
Every backend module follows the same 5 files — this consistency matters more than cleverness,
especially for an AI coding agent working across the repo:
```
modules/<name>/
├── <name>.controller.ts   # HTTP layer only — parses request, calls service, returns response
├── <name>.service.ts      # business logic, calls prisma
├── <name>.routes.ts       # express router, applies auth+role+tenant middleware
├── <name>.dto.ts          # zod/yup input validation schemas
└── tests/<name>.spec.ts
```
Rule: controllers never call `prisma` directly. Services never read `req`/`res`.

## 4. Frontend Route-Group Pattern
Each role gets its own Next.js route group — `(isp)`, `(reseller)`, `(customer)` — but all three
share the **same** `components/ui` primitives and the **same** `styles/tokens.css`. A page must
never hardcode a color or radius; it must use a token or a `ui/` component.

## 5. Naming Conventions
- Folders & files: `kebab-case`
- React components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- DB tables: `snake_case`, plural (`customers`, `router_devices`)
- Prisma models: `PascalCase` singular (`Customer`, `RouterDevice`)
- API routes: `/api/v1/<resource>` plural, REST verbs

## 6. Environment Config
- `.env` per app (`apps/web/.env.local`, `apps/api/.env`) — never commit secrets
- `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NEXT_PUBLIC_API_URL`
- One `.env.example` per app, kept in sync manually until CI check is added

## 7. Required Reading Order for an AI Coding Agent
1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `docs/00-MVP_SCOPE.md`
4. `docs/02-DATABASE_RULES.md`
5. `docs/03-UI_DESIGN_SYSTEM.md` + `docs/04-UI_STRUCTURE.md`
No code should be written for a feature that isn't in `00-MVP_SCOPE.md` §4.
