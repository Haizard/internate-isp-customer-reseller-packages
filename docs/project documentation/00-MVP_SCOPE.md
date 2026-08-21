# MVP Scope — ISP & Reseller Management Platform

## 1. Product Vision
A multi-tenant SaaS platform that lets an ISP manage its network business, lets approved
customers become micro-resellers, and lets end customers self-serve their own connection —
all through one system that can start with **1 ISP / 1 reseller / 1 router / a few customers**
and scale to **100 ISPs / 10,000 resellers / 100,000 routers** without a schema rewrite.

## 2. Tenant Hierarchy (fixed for all phases)
```
ISP (Organization: type=ISP)
 └── Reseller (Organization: type=RESELLER, parentOrgId=ISP.id)
      └── Location (site / house / shop / apartment block)
           └── Router / Gateway (physical or simulated device)
                └── Customer (end user attached to a router)
```
Every record below `Organization` carries an `organizationId` for tenant scoping. This shape
never changes — only the number of nodes at each level grows.

## 3. Roles (RBAC, fixed for all phases)
| Role | Scope | Can do |
|---|---|---|
| **Platform Owner** (you) | Global | Create/suspend ISPs, view platform-wide metrics, impersonate for support |
| **ISP Admin** | Own ISP org + all children | Manage resellers, packages, pricing, bandwidth rules, view revenue, approve reseller requests |
| **Reseller** | Own reseller org + own locations/routers/customers | Manage own locations, add routers, create customers, sell/generate vouchers, view own earnings |
| **Customer** | Self only | View package, manage WiFi name/password, view connected devices, view usage, top up / request upgrade |

Role permissions are enforced server-side on every request (see `13-user-roles` rules in the
database doc) — never trust the client for authorization.

## 4. MVP Feature List — IN SCOPE

### 4.1 ISP Admin Dashboard
- Login / auth (email + password, JWT session)
- Overview: total resellers, total customers, total routers, MRR (mock/simulated revenue)
- Reseller management: list, approve/reject reseller applications, suspend reseller
- Package management: create/edit internet packages (name, speed, price, data cap)
- Bandwidth rule templates (per package, stored only — no real enforcement in MVP)
- Basic reports: customers per reseller, package popularity

### 4.2 Reseller Dashboard
- Login / auth
- Own locations: create/list locations
- Own routers: create/list routers (simulated — no real device pairing yet), assign to location
- Customer management: create/list/edit customers, assign package, assign router
- Voucher generation: create voucher batches (code, data/time allowance, expiry), mark used/unused
- Simple earnings view (package price × active customers, simulated)

### 4.3 Customer Self-Service Portal
- Login / auth
- View current package + status (active/suspended)
- View/edit WiFi name & password (stored value — simulated push to router)
- View connected devices list (seed/mock data in MVP)
- View usage this cycle (mock chart)
- Redeem a voucher / request upgrade (creates a request, no live payment gateway required)

### 4.4 Platform-wide
- Multi-tenant data isolation enforced on every query
- Audit log for create/update/delete on core entities
- Responsive web app: desktop (large screen) layout + mobile/small-screen layout, iOS-style
  glassmorphism UI on both (see `03-UI_DESIGN_SYSTEM.md` and `04-UI_STRUCTURE.md`)

## 5. OUT OF SCOPE for MVP (explicitly deferred)
- Real router/firmware integration (OpenWrt, MikroTik) — routers are DB records only
- On-device edge agents, RADIUS, captive portal, real traffic shaping/QoS
- Real payment gateway integration (mobile money, card) — requests are logged, not charged
- Multi-location reseller with multiple routers doing real load balancing
- Notifications (SMS/email/push) — UI shows placeholders only
- AI assistant / analytics engine
- Native mobile app (the responsive web app is designed to *feel* native instead)

Anything in this "out of scope" list must not be started until the MVP above is fully working
end-to-end (auth → ISP creates package → reseller creates customer → customer sees it).

## 6. Success Criteria for MVP
1. An ISP Admin can create a package and approve a reseller.
2. A Reseller can create a location, a router, and a customer, and generate a voucher.
3. A Customer can log in and see their package, WiFi settings, and redeem a voucher.
4. All three dashboards run on one codebase, share one design system, and are fully usable on
   both a large desktop screen and a small mobile screen without feeling like "two apps."
