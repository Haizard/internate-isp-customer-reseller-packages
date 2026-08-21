# MVP 2 Roadmap - Hardware-Connected Reseller Networking

## 1. Purpose

MVP 2 extends NetMaster from a cloud-only simulated platform into a platform that can control a reseller's real local gateway. The cloud remains responsible for business operations. The gateway or router remains responsible for enforcing network policy.

MVP 2 is intentionally staged. MikroTik is the first hardware target because the project has the Mikhmon reference system and MikroTik RouterOS exposes the capabilities needed for hotspot users, profiles, vouchers, sessions, and queues. OpenWrt is the second hardware target because it supports lower-cost router hardware and is controllable over SSH from a cloud-side Node.js adapter (no on-device agent).

## 2. Target Architecture

```text
ISP-approved fiber service
          |
          v
Reseller WAN / ONT
          |
          v
Reseller gateway
  - MikroTik RouterOS, or
  - OpenWrt (stock firmware, controlled over SSH)
          |
          +-- Access points
          +-- Switches
          +-- Local customer devices

NetMaster Cloud
  Next.js web + Node.js API + PostgreSQL
          |
          +-- MikroTik RouterOS Adapter
          |
          +-- OpenWrt SSH Adapter
```

NetMaster does not carry customer internet traffic. It stores the desired business and network state, sends commands, receives status and usage, and displays the results. The local gateway enforces authentication, speed, quota, expiration, and disconnection.

## 2.1 Operating Model

NetMaster is a cloud connector, not a hardware operator. The reseller purchases and operates the supported gateway and any access points. NetMaster operates the cloud software, adapter, enrollment, configuration, and monitoring services.

The initial supported reseller gateway options are:

- MikroTik hEX lite
- MikroTik hEX refresh
- A specifically tested MikroTik model and hardware revision
- A specifically tested OpenWrt-supported router in the later OpenWrt stage

Approved access points are downstream WiFi devices. They extend coverage but do not replace the gateway. The gateway remains responsible for authentication, vouchers, packages, bandwidth policy, and customer sessions.

For the first MikroTik path, the required integration is:

```text
NetMaster Cloud <-> MikroTik RouterOS API <-> reseller-owned MikroTik gateway
```

The following integrations are optional later paths and are not required to start MVP 2A or MVP 2B:

- ISP API
- RADIUS integration
- OpenWrt SSH adapter (available after MVP 2D)
- Captive portal integration
- ISP webhook or provisioning interface

The ISP must still authorize the reseller's service commercially. NetMaster cannot make an ordinary consumer subscription resellable by software alone.

## 3. Technology Responsibilities

### Cloud platform: Next.js and Node.js

Owns:

- ISP, reseller, location, router, and customer records
- Packages, subscriptions, vouchers, and service requests
- Roles, tenant isolation, billing preparation, and audit history
- Desired gateway configuration
- Router enrollment and command state
- Reporting and dashboard APIs

### MikroTik adapter

Owns the cloud-side integration with RouterOS API. It translates NetMaster operations into RouterOS operations such as:

- Hotspot user profiles
- Hotspot users and vouchers
- Rate limits and queues
- Expiration and quota settings
- Active session reads
- Session disconnects
- Router status and usage reads

The MikroTik adapter does not require Rust to run on the RouterOS device. RouterOS devices run RouterOS, and the adapter communicates with them through the supported RouterOS API.

### OpenWrt adapter

Owns the cloud-side integration with an OpenWrt gateway over SSH. It connects to the router with `ssh2`, runs a shell, and translates NetMaster operations into OpenWrt commands such as:

- UCI configuration writes for hotspot and captive-portal policy
- CoovaChilli user and voucher management (with hostapd fallback)
- `tc`/HTB traffic shaping and QoS queues (via qos-scripts when present)
- `dnsmasq` DHCP pool provisioning
- Active session reads via `chilli_query` and DHCP lease files
- Session disconnects and user suspension
- Router status and usage reads via `/proc`

Like the MikroTik adapter, the OpenWrt adapter runs entirely in the cloud and requires no Rust or on-device agent. OpenWrt ships with OpenSSH, so the adapter works against stock firmware. Optional integration packages (CoovaChilli, qos-scripts) are feature-detected on the router and degrade gracefully to clean failures when absent.

The OpenWrt adapter handles:

- SSH host/port/username/password credentials per router, captured at enrollment
- Heartbeats and health reporting
- Applying firewall and traffic-control policy
- Applying captive portal or local authentication configuration
- Idempotent retries and reconciliation through the shared command queue
- Reporting applied configuration versions and usage

Because the adapter runs in the cloud, offline queueing and recovery are owned by the existing cloud command queue and reconciliation layer rather than an on-device agent. This requires the router to be reachable from the cloud API over SSH while online.

## 4. Delivery Stages

### MVP 2A - Contract and simulator

No hardware required.

Deliver:

- `RouterAdapter` capability contract
- Simulated router implementation
- Simulated connection state and heartbeats
- Simulated package/profile application
- Simulated voucher/customer user creation
- Simulated active sessions and usage
- Simulated expiry, suspension, disconnect, retry, and offline behavior
- Command status and configuration version records
- Contract tests shared by all adapters

The simulator must use the same API commands and result types that real adapters will use. It must not become a separate fake business path.

### MVP 2B - MikroTik integration

First real hardware path.

Start with one RouterOS device in an isolated test network. Initial supported operations:

1. Test RouterOS API connection.
2. Enroll the router to one reseller/location.
3. Create and update a package profile.
4. Create a customer or voucher user.
5. Apply speed and time/data limits.
6. Read active sessions.
7. Disconnect or suspend a user.
8. Read basic usage and router health.
9. Reconcile desired cloud state with RouterOS state.

Use Mikhmon as a behavior and RouterOS-operation reference only. Do not copy its PHP code into NetMaster. The reference project is local-only and ignored by Git.

Initial hardware tiers:

- Entry lab: hAP lite, hEX lite, or equivalent supported RouterOS device.
- Pilot: hEX refresh, hAP ax lite, or equivalent current RouterOS device.
- Growth: RB4011/RB5009 class devices.
- ISP/core: CCR class devices, only after the adapter is proven on smaller devices.

Device prices, capacity, and exact supported models must be verified with the distributor and tested by hardware revision. A low-cost device can be a valid starting gateway, but it is not an unlimited-capacity ISP router.

### MVP 2C - Enrollment and edge operations

After the MikroTik adapter works:

- Device pairing flow
- Router/gateway credentials handling
- Outbound gateway connection where inbound access is unavailable
- Heartbeat and last-seen status
- Command queue and idempotency key
- Retry policy and dead-letter state
- Desired versus applied configuration
- Reconciliation after offline periods
- Operational logs and failure messages

### MVP 2D - OpenWrt integration

Second hardware path.

Start with one exact, documented OpenWrt-supported hardware model and hardware revision. Do not promise compatibility with every TP-Link or other vendor model.

Deliver:

- Cloud-side Node.js OpenWrt SSH adapter (no on-device agent)
- Secure SSH enrollment and credential handling per router
- Heartbeat and system health
- Firewall and traffic-control policy application (UCI, `tc`/HTB)
- Voucher/customer policy application (CoovaChilli with hostapd fallback)
- Session, usage, and lease reads
- Offline command queue and reconciliation via the existing cloud layer
- Graceful feature detection when optional OpenWrt packages are absent

The OpenWrt adapter and MikroTik adapter must implement the same NetMaster capability contract, even though their underlying commands are different.

### MVP 2E - Cooperative ISP integration

Only after one local gateway path is reliable.

Work with one ISP that explicitly authorizes the reseller model. Define an ISP integration contract for:

- Reseller package provisioning
- WAN access method: PPPoE, DHCP/IPoE, VLAN, or static routing
- Bandwidth allocation
- Customer/session accounting
- Suspension and reactivation
- Support escalation
- Billing or payment handoff

NetMaster must not assume that every ISP uses MikroTik. ISPs may use MikroTik, Juniper, Cisco, Huawei, Nokia, ZTE, FreeRADIUS, or proprietary OSS/BSS systems. ISP integrations must be adapter-based.

## 5. Explicit Non-Goals

MVP 2 does not initially include:

- Flashing arbitrary router firmware remotely
- Supporting every TP-Link hardware revision
- Direct access to an ISP's private core network without authorization
- Replacing the ISP's OLT, BNG, RADIUS, or OSS/BSS
- RADIUS and captive portal before the local gateway contract is proven
- Multi-router load balancing before single-gateway reconciliation is reliable
- Native mobile applications
- Payments before the network and subscription lifecycle is stable

## 6. Plug-and-Play Definition

For this project, plug-and-play means:

1. A reseller purchases a supported device.
2. The device is connected to the ISP-approved WAN service.
3. The reseller enrolls it with a pairing code or setup token.
4. NetMaster identifies the device, organization, location, and adapter type.
5. NetMaster applies the default gateway configuration.
6. The reseller creates a package, customer, or voucher in the dashboard.
7. The adapter applies the policy to the gateway.
8. The gateway reports success, health, sessions, and usage.

Plug-and-play does not mean that NetMaster can configure an unknown device with no compatible firmware, credentials, WAN details, or ISP permission.

## 7. Readiness Gate

MVP 2 hardware work is ready to leave simulation when all of the following are available:

- One test MikroTik device
- RouterOS API credentials in an isolated lab
- ISP-approved WAN service or lab WAN simulation
- Defined command and result contracts
- Simulator contract tests passing
- Secure credential storage design
- Router recovery procedure
- A test plan for connect, configure, expire, suspend, reconnect, and reconcile

Until then, implementation should remain in the simulator and cloud contract layers.
