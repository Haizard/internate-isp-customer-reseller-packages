# UI Structure — Layouts, Breakpoints & Page Shells

> This file is the companion to `03-UI_DESIGN_SYSTEM.md`. It defines how pages are assembled
> inside the app: the route groups, the shell components, responsive breakpoints, and the
> card-grid rules every page follows.

## 1. Route Groups

Role areas live under `apps/web/app/`. Next.js route groups (`(name)`) change the physical
folder without affecting the URL; areas that need a distinct URL prefix use a literal folder:

| Role | Folder | URL path | Shell accent |
|---|---|---|---|
| Platform owner | `app/admin/` | `/admin/dashboard` | Blue (`--accent-blue`) |
| ISP admin | `app/(isp)/` | `/dashboard` | Blue (`--accent-blue`) |
| Reseller | `app/reseller/` | `/reseller/dashboard` | Purple (`--accent-purple`) |
| Customer | `app/customer/` | `/customer/dashboard` | Teal (`--accent-teal`) |
| Auth | `app/(auth)/` | `/login`, `/register` | n/a (centered form) |

Notes:
- Do **not** name a role folder `(reseller)` expecting `/reseller/...` — a route group is stripped
  from the URL, so `(reseller)/dashboard` would collide with `(isp)/dashboard` at `/dashboard`.
- A route group layout renders the shared `AppShell` and must not hardcode colors — the shell
  accent is passed as a prop per area (see `app/(isp)/layout.tsx`, `app/reseller/layout.tsx`).
- `AppShell` reads the session from `lib/auth.ts` and redirects to `dashboardPathFor(role)` when
  the current role is not in `allowedRoles`. Backend guards remain the source of truth; the
  frontend redirect is UX only.

## 2. Shell Components

`components/layout/` owns everything shared by the role groups:

- `AppShell.tsx` — top-level frame. Renders `Sidebar` (desktop), `MobileTopBar` + `MobileTabBar`
  (mobile), and the `<main>` content region. Accepts `items`, `accent`, `brand`, `allowedRoles`.
- `Sidebar.tsx` — fixed 260px glass sidebar (≥1024px), role-colored active indicator.
- `MobileNav.tsx` — `MobileTopBar` (iOS large-title bar) and `MobileTabBar` (bottom glass tab bar,
  max 5 items).
- `PageHeader.tsx` — page title + subtitle block used at the top of every content page.
- `NavLink.tsx` — shared nav item type + link renderer.

`components/ui/` holds the design-system primitives (`Button`, `Card`, `Field`, `StatCard`,
`Badge`, `ListRow`, `SegmentedControl`, `States`, `Icon`, …). No raw hex values in components —
always token utilities (`text-accent-blue`, `bg-accent-blue/15`, …).

## 3. Responsive Breakpoints

Breakpoints come from Tailwind's defaults (mobile-first):

| Breakpoint | Tailwind prefix | Layout |
|---|---|---|
| < 768px | base / `sm` | No sidebar. Fixed bottom glass tab bar. iOS large-title top bar. 2-column card grid. |
| 768–1023px | `md` | Collapsible / icon-only sidebar (72px) is acceptable; grid can go 2–3 columns. |
| ≥ 1024px | `lg` | Fixed 260px glass sidebar. Page content offset by `lg:ml-[260px]`. 4-column grid. |

Key rules:
- Content `main` is `px-4 md:px-8 py-6 md:py-8 pb-24 lg:pb-8 max-w-6xl` (see `AppShell.tsx`).
- The bottom padding on mobile (`pb-24`) clears the fixed bottom tab bar.
- `.card-grid` on mobile is always **2 columns** — never 1, never 3. Desktop uses
  `lg:grid-cols-4` for dashboard stat tiles.

## 4. Page Shell

Every content page follows the same skeleton:

1. `PageHeader title="…" subtitle="…"` — iOS large-title header.
2. Stat card row: `<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">` with
   `StatCard` tiles (label, big value, tinted icon, optional sub).
3. Content sections as glass `Card`s: either a `.card-grid` of small cards or a grouped
   list (`ListRow` with hairline dividers between rows).
4. Loading / error handled with `LoadingState` / `ErrorState` from `components/ui/States.tsx`.

## 5. Card Grid Rules

- Dashboard stat row: `grid grid-cols-2 lg:grid-cols-4` (2 on mobile, 4 on desktop).
- Secondary stat tiles (e.g. platform owner detail tiles): `grid-cols-2 lg:grid-cols-3`.
- Item lists: one grouped glass card; rows separated by the `hairline` divider class, not visible
  grid lines.

## 6. Dashboard Content

| Dashboard | Data source (API) | Stat tiles |
|---|---|---|
| ISP admin (`/dashboard`) | `GET /organizations/overview` | Resellers, Customers, Routers, MRR |
| Reseller (`/reseller/dashboard`) | `GET /organizations/overview` (scoped to self) | Customers, Routers, Locations, MRR |
| Platform owner (`/admin/dashboard`) | `GET /organizations/platform-overview` | ISPs, Resellers, Customers, Platform MRR |
| Customer (`/customer/dashboard`) | customer endpoints (devices, usage, subscription) | Connection status, usage, plan |

Money is always an integer in the lowest unit (`priceCents` / `mrrCents`) and formatted on the
client with `formatCents()` from `lib/format.ts`.

## 7. Status & Empty States

- `LoadingState` — centered spinner in a glass card.
- `ErrorState` — alert icon + message + optional Retry (re-triggers the `useApi` reload).
- `EmptyState` — used for empty lists ("No resellers yet").

## 8. Testing & Lint Hooks

- Frontend `typecheck` is `tsc --noEmit`; `lint` is `eslint` (Next.js config).
- After any UI change, run `npm run typecheck && npm run lint` from `apps/web` (or `npm run
  typecheck` / `npm run lint` from the repo root via turbo).
