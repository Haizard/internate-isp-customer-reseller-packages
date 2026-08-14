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
   tickets workspace). Any page that reads `useSearchParams` must be wrapped in a
   `Suspense` boundary or the production build fails.
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
  department actually needs it (YAGNI — see `DECISIONS.md` ADR-002 for the modular
  monolith reasoning).
