# DECISIONS.md — Architectural Decision Records (ADR)

This file records significant architectural decisions, their context, rationale, and consequences.

---

## ADR-001: Monorepo Architecture with Turborepo
- **Status**: Accepted
- **Context**: The project consists of a Next.js web application (3 role-based dashboards), a Node.js API server, and shared TypeScript types/tokens.
- **Decision**: Use a Turborepo monorepo with `apps/` and `packages/`.
- **Rationale**: Keeps all code in a single repository for solo development, allows sharing DTOs/types between frontend and backend without publishing npm packages, and optimizes build speed.

---

## ADR-002: Modular Monolith Backend for MVP
- **Status**: Accepted
- **Context**: We need a backend architecture that is easy to build, deploy, and test for MVP, but scalable for future microservices or edge agents.
- **Decision**: Build the backend as a Modular Monolith in Node.js/TypeScript using Express (or NestJS).
- **Rationale**: Eliminates microservices communication overhead during MVP while keeping clean module boundaries (`modules/<name>/`) so components can be extracted later if necessary.

---

## ADR-003: Self-Referencing Organization Hierarchy
- **Status**: Accepted
- **Context**: The platform needs to support ISPs, Resellers, and multi-tier organizations.
- **Decision**: Model `Organization` with a self-referencing `parentOrgId` relation (`parentOrgId -> Organization.id`).
- **Rationale**: Allows an unlimited hierarchy depth (Platform -> ISP -> Reseller -> Sub-reseller) in a single table without complex join tables.

---

## ADR-004: iOS-Native Light Glassmorphism UI Design System
- **Status**: Accepted
- **Context**: The web application must look premium, modern, and feel like a native app on both desktop and mobile devices.
- **Decision**: Implement an iOS-inspired light glassmorphism theme using CSS custom properties, Tailwind CSS, backdrop blurs, diffuse shadows, and responsive layout patterns (bottom tab bar on mobile, fixed glass sidebar on desktop).
- **Rationale**: Creates a distinctive, high-end user experience that stands out from generic dark dashboard templates.

---

## ADR-005: Deferring Edge Hardware & Real Packet Processing to Phase 2
- **Status**: Accepted
- **Context**: Real router firmware flashing, Rust edge agents, RADIUS, and Linux kernel traffic shaping add hardware dependencies and deployment complexity.
- **Decision**: Defer all physical network execution to Phase 2. For the MVP, routers, bandwidth policies, and vouchers are modeled as DB entities and simulated in software.
- **Rationale**: Allows delivering a complete, interactive, end-to-end working software product in weeks to demonstrate business value to ISPs.

---

## ADR-006: MikroTik First, OpenWrt Second, Rust at the Edge
- **Status**: Accepted
- **Context**: MVP 2 needs a realistic path from the simulated router model to affordable reseller hardware. Mikhmon provides a useful reference for MikroTik RouterOS hotspot, voucher, profile, session, and queue operations. OpenWrt supports lower-cost hardware but requires a different control mechanism.
- **Decision**: Build a shared router capability contract and simulator first. Implement the first real adapter for MikroTik RouterOS through its API. Implement OpenWrt as the second adapter, with a Rust Gateway Agent running on OpenWrt or another supported Linux gateway.
- **Rationale**: MikroTik gives the fastest path to a proven hardware integration. OpenWrt provides a broader low-cost hardware path. Rust is best isolated to the long-running edge agent where low memory use, reliable operation, retries, and local networking control matter. It should not replace the Next.js/Node.js cloud platform and cannot generally run directly on RouterOS.
- **Consequences**: The cloud API must remain hardware-neutral. Each adapter must support the same operations for profiles, users/vouchers, limits, sessions, usage, health, suspension, and reconciliation. Hardware-specific behavior belongs behind the adapter boundary. See `05-MVP2_ROADMAP.md` for delivery stages and readiness gates.
