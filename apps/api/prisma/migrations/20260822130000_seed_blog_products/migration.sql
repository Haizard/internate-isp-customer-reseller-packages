-- NetMaster: Seed blog posts, categories, products, and product categories.
-- Run AFTER the blog_posts, blog_categories, products, product_categories tables exist.

-- ═══════════════════════════════════════════════════════════
-- BLOG CATEGORIES (top-level)
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('blogcat-001', 'Getting Started', 'getting-started', 'New to NetMaster? Start here.', NULL, NOW(), NOW()),
  ('blogcat-002', 'MikroTik', 'mikrotik', 'MikroTik router configuration guides.', NULL, NOW(), NOW()),
  ('blogcat-003', 'Reseller Tips', 'reseller-tips', 'Grow your reselling business.', NULL, NOW(), NOW()),
  ('blogcat-004', 'Network Security', 'network-security', 'Keep your network and customers safe.', NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- SUBCATEGORIES
INSERT INTO "blog_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('blogcat-010', 'Quick Setup', 'quick-setup', 'Get running in under 30 minutes.', 'blogcat-001', NOW(), NOW()),
  ('blogcat-011', 'RouterOS Basics', 'routeros-basics', 'Essential RouterOS v7 knowledge.', 'blogcat-002', NOW(), NOW()),
  ('blogcat-012', 'Hotspot Setup', 'hotspot-setup', 'Configure hotspot portals.', 'blogcat-002', NOW(), NOW()),
  ('blogcat-013', 'Revenue Growth', 'revenue-growth', 'Strategies to increase sales.', 'blogcat-003', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- BLOG POST 1
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_posts" ("id", "title", "slug", "content", "excerpt", "coverImage", "author", "tags", "linkedProductIds", "categoryId", "published", "created_at", "updated_at")
VALUES (
  'blogpost-001',
  'How to Set Up Your First WiFi Hotspot with NetMaster',
  'setup-first-wifi-hotspot-netmaster',
  $BODY$## Getting Started with NetMaster

Setting up your first WiFi hotspot has never been easier. In this guide, we walk you through the complete process from registering your reseller account to selling your first voucher.

### Step 1: Create Your Account

Head over to NetMaster and click Get Started Free. You will be up and running in less than 30 seconds.

### Step 2: Create a Location

Each physical office or coverage area is a Location. Navigate to Locations and click New Location. Give it a name and an address.

### Step 3: Register Your Router

Go to Routers and add your MikroTik device. Enter the router name and MAC address. The router must be on and reachable from the internet.

### Step 4: Create a Package

Define what you sell - speed, data cap, and price. For example:
- Basic: 5 Mbps, 5GB, 2,000 TZS/day
- Premium: 10 Mbps, 15GB, 5,000 TZS/day
- Unlimited: 20 Mbps, unlimited, 10,000 TZS/day

### Step 5: Generate Vouchers

Go to Vouchers and generate a batch. Choose the package, quantity, and expiry. Each voucher gets a unique code your customers can redeem.

### Step 6: Share the Hotspot Portal

Your hotspot portal URL is /hotspot?id=LOCATION_ID. Customers open this, enter a voucher code, and they are online.

## Tips for Success

1. Start small - test with 5-10 vouchers before scaling
2. Set expiry dates - vouchers that never expire create accounting headaches
3. Monitor usage - check your dashboard daily to spot patterns
4. Offer packages - bundled pricing (3-day, 7-day, 30-day) converts better

You are now a WiFi reseller! Welcome to the network economy.$BODY$,
  'A complete step-by-step guide to setting up your first WiFi hotspot and selling vouchers in under 30 minutes.',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  'NetMaster Team',
  'getting started,wifi hotspot,voucher,setup',
  NULL,
  'blogcat-010',
  true,
  NOW(),
  NOW()
);

-- ═══════════════════════════════════════════════════════════
-- BLOG POST 2
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_posts" ("id", "title", "slug", "content", "excerpt", "coverImage", "author", "tags", "linkedProductIds", "categoryId", "published", "created_at", "updated_at")
VALUES (
  'blogpost-002',
  'MikroTik RouterOS v7: The Complete Beginner Guide',
  'mikrotik-routeros-v7-beginner-guide',
  $BODY$## Why MikroTik?

MikroTik is the router of choice for ISP resellers across East Africa and for good reason. Affordable hardware, powerful software, and a massive feature set.

But RouterOS v7 can be intimidating if you are coming from consumer routers. This guide breaks it down.

## What is RouterOS?

RouterOS is the operating system that runs on MikroTik hardware. Think of it as the brain of your router. It controls:
- WiFi hotspot portals
- Bandwidth limiting per customer
- VPN tunnels between offices
- Firewall and security rules
- User authentication

## Key Concepts

### The WinBox Interface

WinBox is the desktop app for managing MikroTik routers. Download it from mikrotik.com and connect using your router IP address.

### Hotspot Setup

The Hotspot feature is what makes WiFi reselling possible. It:
1. Captures all HTTP traffic from new devices
2. Redirects them to a login page (your branded voucher page)
3. Authenticates the user via voucher code
4. Applies bandwidth limits based on the package

### Queue / Simple Queue

Simple Queues control bandwidth per user. When a customer logs in with a voucher, NetMaster automatically creates a queue limiting their speed to the package speed.

### Firewall NAT

NAT (Network Address Translation) allows multiple customers to share one public IP address. This is essential for hotspot operation.

## Common Issues

| Problem | Solution |
|---------|----------|
| Customer cannot connect | Check hotspot is active on the interface |
| Speed is too slow | Verify Simple Queue limits match the package |
| Login page not showing | Check hotspot HTML directory is set correctly |
| Router offline in dashboard | Ensure RouterOS API port (8728) is open |

## Next Steps

Once you understand these basics, you are ready to configure your first router for NetMaster. Check our Hotspot Setup Guide for the step-by-step configuration.$BODY$,
  'Understand MikroTik RouterOS v7 from WinBox to hotspots, queues, and firewall rules.',
  'https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=800&q=80',
  'NetMaster Team',
  'mikrotik,routeros,v7,beginner,hotspot,wifi',
  'product-002',
  'blogcat-011',
  true,
  NOW(),
  NOW()
);

-- ═══════════════════════════════════════════════════════════
-- BLOG POST 3
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_posts" ("id", "title", "slug", "content", "excerpt", "coverImage", "author", "tags", "linkedProductIds", "categoryId", "published", "created_at", "updated_at")
VALUES (
  'blogpost-003',
  '5 Pricing Strategies That Triple Your Reseller Revenue',
  'pricing-strategies-triple-reseller-revenue',
  $BODY$## The Pricing Problem

Most WiFi resellers leave money on the table. They set a single price per hour or per day and wonder why revenue stagnates.

The truth? Pricing is a strategy, not an afterthought.

## Strategy 1: Time-Bundled Pricing

Instead of selling per-hour, sell per-period:
- 1 Day Pass: 1,500 TZS
- 3 Day Pass: 3,500 TZS (save 1,000 TZS)
- 7 Day Pass: 6,500 TZS (save 4,000 TZS)
- 30 Day Pass: 20,000 TZS (save 25,000 TZS)

Why it works: Customers feel they are getting a deal, and you get predictable recurring revenue.

## Strategy 2: Speed Tiers

Offer 2-3 speed tiers. Most customers will pick the middle one:
- Basic: 5 Mbps at 2,000 TZS/day
- Standard: 10 Mbps at 3,500 TZS/day
- Premium: 20 Mbps at 6,000 TZS/day

Why it works: The premium tier exists to make Standard look like a bargain.

## Strategy 3: Off-Peak Discounts

Offer lower prices during off-peak hours (e.g., 10 PM to 6 AM). This fills capacity that would otherwise be wasted.

## Strategy 4: Corporate Packages

Target small businesses and offices with:
- Fixed monthly pricing
- Dedicated bandwidth
- Priority support
- Multiple device support

Corporate customers pay 3-5x more than individual users.

## Strategy 5: Voucher Reselling

Sell vouchers in bulk at a discount to shop owners, kiosks, and hotels. They resell at full price and you get guaranteed volume.

## Revenue Example

With 50 active customers:
- 20 Basic at 2,000 TZS/day = 1,200,000 TZS/month
- 20 Standard at 3,500 TZS/day = 2,100,000 TZS/month
- 10 Premium at 6,000 TZS/day = 1,800,000 TZS/month
- Total: 5,100,000 TZS/month (about $2,000 USD)

With the right pricing strategy, 50 customers can fund your entire operation.$BODY$,
  'Proven pricing strategies that WiFi resellers use to maximize revenue.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'NetMaster Team',
  'pricing,revenue,strategy,reseller,business,tips',
  NULL,
  'blogcat-013',
  true,
  NOW(),
  NOW()
);

-- ═══════════════════════════════════════════════════════════
-- BLOG POST 4
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_posts" ("id", "title", "slug", "content", "excerpt", "coverImage", "author", "tags", "linkedProductIds", "categoryId", "published", "created_at", "updated_at")
VALUES (
  'blogpost-004',
  'How to Secure Your WiFi Network',
  'secure-wifi-network-resellers-guide',
  $BODY$## Why Security Matters

As a WiFi reseller, you are responsible for your customers internet safety. A breach can destroy your reputation overnight.

Here are the essential security measures every reseller must implement.

## 1. Enable Firewall on Every Router

MikroTik built-in firewall is powerful but disabled by default. Enable it immediately to protect your management interface from unauthorized access.

## 2. Change Default Passwords

The single most important thing you can do. Every MikroTik router ships with a default admin password. Change it before connecting to the internet.

## 3. Use WPA2/WPA3 Encryption

Never use open WiFi for your management network. Customer hotspots are open (that is how vouchers work), but your management traffic must be encrypted.

## 4. Segment Customer Traffic

Use VLANs or separate interfaces to isolate customer traffic from your management network. If one customer gets compromised, the others stay safe.

## 5. Enable MAC Address Logging

Track which device used which voucher. This helps with:
- Abuse detection
- Customer support
- Billing disputes

NetMaster automatically logs device MAC addresses when customers redeem vouchers.

## 6. Regular Firmware Updates

MikroTik releases security patches regularly. Update your RouterOS at least monthly.

## 7. Rate Limit Abuse

Set per-user bandwidth limits to prevent any single customer from consuming all your bandwidth. This is built into every NetMaster package.

## 8. Monitor Logs Daily

Check your router logs for:
- Failed login attempts
- Unusual traffic patterns
- New device connections

## The NetMaster Advantage

NetMaster handles many of these security tasks automatically:
- Per-user bandwidth limiting
- Device tracking (MAC addresses)
- Voucher expiration
- Automatic suspension of expired accounts
- Audit logging of all admin actions

A secure network is a trusted network. And trusted networks keep customers coming back.$BODY$,
  'Essential security measures every WiFi reseller must implement.',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  'NetMaster Team',
  'security,firewall,mikrotik,wifi,network,protection',
  'product-001',
  'blogcat-004',
  true,
  NOW(),
  NOW()
);

-- ═══════════════════════════════════════════════════════════
-- PRODUCT CATEGORIES
-- ═══════════════════════════════════════════════════════════

INSERT INTO "product_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('prodcat-001', 'Entry-Level', 'entry-level', 'Affordable routers for small offices.', NULL, NOW(), NOW()),
  ('prodcat-002', 'Mid-Range', 'mid-range', 'Powerful routers for growing resellers.', NULL, NOW(), NOW()),
  ('prodcat-003', 'Enterprise', 'enterprise', 'High-performance routers for large networks.', NULL, NOW(), NOW()),
  ('prodcat-004', 'Accessories', 'accessories', 'Cables, antennas, and mounting hardware.', NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "product_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('prodcat-010', 'Indoor Routers', 'indoor-routers', 'Routers for indoor deployment.', 'prodcat-001', NOW(), NOW()),
  ('prodcat-011', 'Outdoor Routers', 'outdoor-routers', 'Weatherproof routers for outdoor use.', 'prodcat-001', NOW(), NOW()),
  ('prodcat-012', 'PoE Routers', 'poe-routers', 'Power over Ethernet capable routers.', 'prodcat-002', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════════

INSERT INTO "products" ("id", "name", "slug", "description", "price", "comparePrice", "imageUrl", "specs", "features", "stock", "published", "featured", "linkedBlogIds", "categoryId", "created_at", "updated_at")
VALUES (
  'product-001',
  'MikroTik hEX lite (RB750Gr3)',
  'mikrotik-hex-lite-rb750gr3',
  'The hEX lite is the smallest MikroTik device with dual-core 880MHz CPU, 256MB RAM, five Gigabit Ethernet ports and a USB port. Perfect for small offices and new resellers.',
  25000000,
  30000000,
  'https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=800&q=80',
  'CPU: Dual-core 880MHz MT7621A; RAM: 256MB; Storage: 16MB flash; Ethernet: 5x Gigabit; USB: 1x USB 2.0; Dimensions: 113x89x28mm',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN',
  25,
  true,
  true,
  'blogpost-002,blogpost-004',
  'prodcat-010',
  NOW(),
  NOW()
),
(
  'product-002',
  'MikroTik hEX refresh (RB760iGS)',
  'mikrotik-hex-refresh-rb760igs',
  'Compact five-port Gigabit Ethernet router with PoE output, SFP cage, and USB port. For resellers with 50-150 customers.',
  45000000,
  52000000,
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
  'CPU: Dual-core 880MHz MT7621A; RAM: 256MB; Ethernet: 5x Gigabit (1x PoE out); SFP: 1x SFP cage; USB: 1x USB 2.0',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,POE Output',
  18,
  true,
  true,
  'blogpost-001,blogpost-002',
  'prodcat-012',
  NOW(),
  NOW()
),
(
  'product-003',
  'MikroTik RB4011iGS+5HacQ2HnD-IN',
  'mikrotik-rb4011-5hacq2hnd-in',
  'Quad-core 1.4GHz, 1GB RAM, SFP+ 10G, 10x Gigabit, built-in WiFi. The workhorse for serious resellers. Handles 200+ concurrent users.',
  120000000,
  140000000,
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  'CPU: Quad-core 1.4GHz Cortex A15; RAM: 1GB DDR3; Ethernet: 10x Gigabit (1x PoE in); SFP+: 1x 10Gbps; WiFi: Dual-band 802.11ac',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,WiFi AP,Dual-Band',
  8,
  true,
  true,
  'blogpost-001,blogpost-002,blogpost-004',
  'prodcat-003',
  NOW(),
  NOW()
),
(
  'product-004',
  'MikroTik RB5009UG+S+IN',
  'mikrotik-rb5009-ugs-in',
  'Most powerful compact router. 2.5G + 10G SFP+, quad-core ARM, 1GB RAM. Handles 500+ concurrent users. Enterprise-grade.',
  250000000,
  290000000,
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  'CPU: Quad-core 1.4GHz ARM; RAM: 1GB DDR3; Ethernet: 7x Gigabit + 1x 2.5G; SFP+: 1x 10Gbps; Full metal case',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,2.5G Ethernet,10G SFP+,Enterprise',
  5,
  true,
  false,
  'blogpost-002',
  'prodcat-003',
  NOW(),
  NOW()
);
