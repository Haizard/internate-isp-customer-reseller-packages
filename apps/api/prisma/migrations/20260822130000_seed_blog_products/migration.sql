-- NetMaster: Seed blog posts, categories, products, and product categories.
-- Run AFTER the blog_posts, blog_categories, products, product_categories tables exist.

-- ═══════════════════════════════════════════════════════════
-- BLOG CATEGORIES
-- ═══════════════════════════════════════════════════════════

-- Top-level categories
INSERT INTO "blog_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('blogcat-001', 'Getting Started', 'getting-started', 'New to NetMaster? Start here.', NULL, NOW(), NOW()),
  ('blogcat-002', 'MikroTik', 'mikrotik', 'MikroTik router configuration guides.', NULL, NOW(), NOW()),
  ('blogcat-003', 'Reseller Tips', 'reseller-tips', 'Grow your reselling business.', NULL, NOW(), NOW()),
  ('blogcat-004', 'Network Security', 'network-security', 'Keep your network and customers safe.', NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Subcategories
INSERT INTO "blog_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('blogcat-010', 'Quick Setup', 'quick-setup', 'Get running in under 30 minutes.', 'blogcat-001', NOW(), NOW()),
  ('blogcat-011', 'RouterOS Basics', 'routeros-basics', 'Essential RouterOS v7 knowledge.', 'blogcat-002', NOW(), NOW()),
  ('blogcat-012', 'Hotspot Setup', 'hotspot-setup', 'Configure hotspot portals.', 'blogcat-002', NOW(), NOW()),
  ('blogcat-013', 'Revenue Growth', 'revenue-growth', 'Strategies to increase sales.', 'blogcat-003', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- BLOG POSTS (4 posts)
-- ═══════════════════════════════════════════════════════════

INSERT INTO "blog_posts" ("id", "title", "slug", "content", "excerpt", "coverImage", "author", "tags", "linkedProductIds", "categoryId", "published", "created_at", "updated_at")
VALUES
(
  'blogpost-001',
  'How to Set Up Your First WiFi Hotspot with NetMaster',
  'setup-first-wifi-hotspot-netmaster',
  E'## Getting Started with NetMaster\n\nSetting up your first WiFi hotspot has never been easier. In this guide, we walk you through the complete process — from registering your reseller account to selling your first voucher.\n\n### Step 1: Create Your Account\n\nHead over to NetMaster and click "Get Started Free." You will be up and running in less than 30 seconds.\n\n### Step 2: Create a Location\n\nEach physical office or coverage area is a "Location." Navigate to **Locations** and click "New Location." Give it a name (e.g., "Mbezi Shop") and an address.\n\n### Step 3: Register Your Router\n\nGo to **Routers** and add your MikroTik device. Enter the router name and MAC address. The router must be on and reachable from the internet.\n\n### Step 4: Create a Package\n\nDefine what you sell — speed, data cap, and price. For example:\n- **Basic**: 5 Mbps, 5GB, 2,000 TZS/day\n- **Premium**: 10 Mbps, 15GB, 5,000 TZS/day\n- **Unlimited**: 20 Mbps, unlimited, 10,000 TZS/day\n\n### Step 5: Generate Vouchers\n\nGo to **Vouchers** and generate a batch. Choose the package, quantity, and expiry. Each voucher gets a unique code your customers can redeem.\n\n### Step 6: Share the Hotspot Portal\n\nYour hotspot portal URL is `/hotspot?id=<locationId>`. Customers open this, enter a voucher code, and they are online.\n\n## Tips for Success\n\n1. **Start small** — test with 5-10 vouchers before scaling\n2. **Set expiry dates** — vouchers that never expire create accounting headaches\n3. **Monitor usage** — check your dashboard daily to spot patterns\n4. **Offer packages** — bundled pricing (3-day, 7-day, 30-day) converts better\n\nYou are now a WiFi reseller! Welcome to the network economy.',
  'A complete step-by-step guide to setting up your first WiFi hotspot and selling vouchers in under 30 minutes.',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  'NetMaster Team',
  'getting started,wifi hotspot,voucher,setup',
  NULL,
  'blogcat-010',
  true,
  NOW(),
  NOW()
),
(
  'blogpost-002',
  'MikroTik RouterOS v7: The Complete Beginner Guide',
  'mikrotik-routeros-v7-beginner-guide',
  E'## Why MikroTik?\n\nMikroTik is the router of choice for ISP resellers across East Africa — and for good reason. Affordable hardware, powerful software, and a massive feature set.\n\nBut RouterOS v7 can be intimidating if you are coming from consumer routers. This guide breaks it down.\n\n## What is RouterOS?\n\nRouterOS is MikroTik''s operating system. Think of it as the "brain" of your router. It controls:\n- WiFi hotspot portals\n- Bandwidth limiting per customer\n- VPN tunnels between offices\n- Firewall and security rules\n- User authentication\n\n## Key Concepts\n\n### The WinBox Interface\n\nWinBox is the desktop app for managing MikroTik routers. Download it from mikrotik.com and connect using your router''s IP address.\n\n### Hotspot Setup\n\nThe Hotspot feature is what makes WiFi reselling possible. It:\n1. Captures all HTTP traffic from new devices\n2. Redirects them to a login page (your branded voucher page)\n3. Authenticates the user via voucher code\n4. Applies bandwidth limits based on the package\n\n### Queue / Simple Queue\n\nSimple Queues control bandwidth per user. When a customer logs in with a voucher, NetMaster automatically creates a queue limiting their speed to the package speed.\n\n### Firewall NAT\n\nNAT (Network Address Translation) allows multiple customers to share one public IP address. This is essential for hotspot operation.\n\n## Common Issues\n\n| Problem | Solution |\n|---------|----------|\n| Customer cannot connect | Check hotspot is active on the interface |\n| Speed is too slow | Verify Simple Queue limits match the package |\n| Login page not showing | Check hotspot''s HTML directory is set correctly |\n| Router offline in dashboard | Ensure RouterOS API port (8728) is open |\n\n## Next Steps\n\nOnce you understand these basics, you are ready to configure your first router for NetMaster. Check our [Hotspot Setup Guide](/blog/hotspot-setup-mikrotik) for the step-by-step configuration.',
  'Understand MikroTik RouterOS v7 — from WinBox to hotspots, queues, and firewall rules. Everything a new reseller needs to know.',
  'https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=800&q=80',
  'NetMaster Team',
  'mikrotik,routeros,v7,beginner,hotspot,wifi',
  'product-002',
  'blogcat-011',
  true,
  NOW(),
  NOW()
),
(
  'blogpost-003',
  '5 Pricing Strategies That Triple Your Reseller Revenue',
  'pricing-strategies-triple-reseller-revenue',
  E'## The Pricing Problem\n\nMost WiFi resellers leave money on the table. They set a single price per hour or per day and wonder why revenue stagnates.\n\nThe truth? **Pricing is a strategy, not an afterthought.**\n\n## Strategy 1: Time-Bundled Pricing\n\nInstead of selling per-hour, sell per-period:\n- **1 Day Pass**: 1,500 TZS\n- **3 Day Pass**: 3,500 TZS (save 1,000 TZS)\n- **7 Day Pass**: 6,500 TZS (save 4,000 TZS)\n- **30 Day Pass**: 20,000 TZS (save 25,000 TZS)\n\n**Why it works**: Customers feel they are getting a deal, and you get predictable recurring revenue.\n\n## Strategy 2: Speed Tiers\n\nOffer 2-3 speed tiers. Most customers will pick the middle one:\n- **Basic**: 5 Mbps — 2,000 TZS/day\n- **Standard**: 10 Mbps — 3,500 TZS/day\n- **Premium**: 20 Mbps — 6,000 TZS/day\n\n**Why it works**: The premium tier exists to make Standard look like a bargain.\n\n## Strategy 3: Off-Peak Discounts\n\nOffer lower prices during off-peak hours (e.g., 10 PM to 6 AM). This fills capacity that would otherwise be wasted.\n\n## Strategy 4: Corporate Packages\n\nTarget small businesses and offices with:\n- Fixed monthly pricing\n- Dedicated bandwidth\n- Priority support\n- Multiple device support\n\n**Corporate customers pay 3-5x more** than individual users.\n\n## Strategy 5: Voucher Reselling\n\nSell vouchers in bulk at a discount to shop owners, kiosks, and hotels. They resell at full price and you get guaranteed volume.\n\n## Revenue Example\n\nWith 50 active customers:\n- 20 Basic @ 2,000 TZS/day = 1,200,000 TZS/month\n- 20 Standard @ 3,500 TZS/day = 2,100,000 TZS/month\n- 10 Premium @ 6,000 TZS/day = 1,800,000 TZS/month\n- **Total: 5,100,000 TZS/month** (~$2,000 USD)\n\nWith the right pricing strategy, 50 customers can fund your entire operation.\n\n## Getting Started\n\nUse NetMaster to set up multiple packages, track which ones sell best, and adjust pricing based on data — not guesswork.',
  'Proven pricing strategies that WiFi resellers use to maximize revenue. From time-bundling to corporate packages.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'NetMaster Team',
  'pricing,revenue,strategy,reseller,business,tips',
  NULL,
  'blogcat-013',
  true,
  NOW(),
  NOW()
),
(
  'blogpost-004',
  'How to Secure Your WiFi Network: A Reseller''s Guide',
  'secure-wifi-network-resellers-guide',
  E'## Why Security Matters\n\nAs a WiFi reseller, you are responsible for your customers'' internet safety. A breach can destroy your reputation overnight.\n\nHere are the essential security measures every reseller must implement.\n\n## 1. Enable Firewall on Every Router\n\nMikroTik''s built-in firewall is powerful but disabled by default. Enable it immediately:\n\n```\n/ip/firewall/filter\nadd chain=input action=accept protocol=udp dst-port=8728 src-address=YOUR_IP\nadd chain=input action=drop protocol=udp dst-port=8728\n```\n\nThis protects your router management interface from unauthorized access.\n\n## 2. Change Default Passwords\n\nThe single most important thing you can do. Every MikroTik router ships with a default admin password. Change it before connecting to the internet.\n\n## 3. Use WPA2/WPA3 Encryption\n\nNever use open WiFi for your management network. Customer hotspots are open (that is how vouchers work), but your management traffic must be encrypted.\n\n## 4. Segment Customer Traffic\n\nUse VLANs or separate interfaces to isolate customer traffic from your management network. If one customer gets compromised, the others stay safe.\n\n## 5. Enable MAC Address Logging\n\nTrack which device used which voucher. This helps with:\n- Abuse detection\n- Customer support\n- Billing disputes\n\nNetMaster automatically logs device MAC addresses when customers redeem vouchers.\n\n## 6. Regular Firmware Updates\n\nMikroTik releases security patches regularly. Update your RouterOS at least monthly:\n- Check version: `/system package update print`\n- Install update: `/system package update install`\n\n## 7. Rate Limit Abuse\n\nSet per-user bandwidth limits to prevent any single customer from consuming all your bandwidth. This is built into every NetMaster package.\n\n## 8. Monitor Logs Daily\n\nCheck your router logs for:\n- Failed login attempts\n- Unusual traffic patterns\n- New device connections\n\n## The NetMaster Advantage\n\nNetMaster handles many of these security tasks automatically:\n- ✅ Per-user bandwidth limiting\n- ✅ Device tracking (MAC addresses)\n- ✅ Voucher expiration\n- ✅ Automatic suspension of expired accounts\n- ✅ Audit logging of all admin actions\n\n## Quick Security Checklist\n\n- [ ] Changed default router password\n- [ ] Firewall enabled\n- [ ] Management port restricted\n- [ ] Customer traffic segmented\n- [ ] Firmware up to date\n- [ ] Logging enabled\n- [ ] Bandwidth limits configured\n\nA secure network is a trusted network. And trusted networks keep customers coming back.',
  'Essential security measures every WiFi reseller must implement to protect customers and their network infrastructure.',
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

-- Top-level categories
INSERT INTO "product_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('prodcat-001', 'Entry-Level', 'entry-level', 'Affordable routers for small offices and new resellers.', NULL, NOW(), NOW()),
  ('prodcat-002', 'Mid-Range', 'mid-range', 'Powerful routers for growing resellers.', NULL, NOW(), NOW()),
  ('prodcat-003', 'Enterprise', 'enterprise', 'High-performance routers for large networks.', NULL, NOW(), NOW()),
  ('prodcat-004', 'Accessories', 'accessories', 'Cables, antennas, and mounting hardware.', NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Subcategories
INSERT INTO "product_categories" ("id", "name", "slug", "description", "parentId", "created_at", "updated_at")
VALUES
  ('prodcat-010', 'Indoor Routers', 'indoor-routers', 'Routers for indoor deployment.', 'prodcat-001', NOW(), NOW()),
  ('prodcat-011', 'Outdoor Routers', 'outdoor-routers', 'Weatherproof routers for outdoor use.', 'prodcat-001', NOW(), NOW()),
  ('prodcat-012', 'PoE Routers', 'poe-routers', 'Power over Ethernet capable routers.', 'prodcat-002', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS (4 products)
-- ═══════════════════════════════════════════════════════════

INSERT INTO "products" ("id", "name", "slug", "description", "price", "comparePrice", "imageUrl", "specs", "features", "stock", "published", "featured", "linkedBlogIds", "categoryId", "created_at", "updated_at")
VALUES
(
  'product-001',
  'MikroTik hEX lite (RB750Gr3)',
  'mikrotik-hex-lite-rb750gr3',
  E'The hEX lite is the smallest MikroTik device. It has a dual-core 880MHz CPU, 256MB RAM, five Gigabit Ethernet ports and a USB port.\n\nPerfect for small offices and new resellers who want enterprise-grade features at an affordable price.\n\n**Why resellers love it:**\n- Runs RouterOS v7 with full hotspot support\n- Handles up to 50 concurrent users\n- Very low power consumption\n- Compact enough to fit anywhere',
  25000000,
  30000000,
  'https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=800&q=80',
  E'CPU: Dual-core 880MHz MT7621A\nRAM: 256MB\nStorage: 16MB flash\nEthernet: 5x Gigabit\nUSB: 1x USB 2.0\nDimensions: 113x89x28mm\nWeight: 170g\nPower: 5V-2A',
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
  E'The hEX refresh is a compact five-port Gigabit Ethernet router for scenarios where high performance and a small size are required.\n\nFeatures a fast CPU, SFP cage, USB port, and PoE output on port 5 — powering a PoE-capable access point while getting data to it.\n\n**Ideal for:** Resellers with 50-150 customers who need PoE support and more processing power.',
  45000000,
  52000000,
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
  E'CPU: Dual-core 880MHz MT7621A\nRAM: 256MB\nStorage: 16MB flash\nEthernet: 5x Gigabit (1x PoE out)\nSFP: 1x SFP cage\nUSB: 1x USB 2.0\nDimensions: 113x89x28mm\nWeight: 170g\nPower: 5V-2A',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,SD-WAN,POE Output',
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
  E'The RB4011 uses a quad-core Cortex A15 CPU running at 1.4GHz, 1GB RAM, SFP+ 10Gbps cage, ten Gigabit Ethernet ports, and built-in dual-band 802.11ac WiFi.\n\n**The workhorse for serious resellers.** Handles 200+ concurrent users with room to grow.\n\n**Why upgrade to RB4011:**\n- Quad-core 1.4GHz CPU handles heavy loads\n- Built-in WiFi for office coverage\n- SFP+ for fiber uplinks\n- PoE-in on port 10 for powering from a switch',
  120000000,
  140000000,
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  E'CPU: Quad-core 1.4GHz Cortex A15\nRAM: 1GB DDR3\nStorage: 512MB flash\nEthernet: 10x Gigabit (1x PoE in)\nSFP+: 1x 10Gbps\nWiFi: Dual-band 802.11ac\nDimensions: 228x124x30mm\nWeight: 720g\nPower: 12V-2A (802.3af PoE in)',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,WiFi AP,Dual-Band,WAVE2',
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
  E'The RB5009 is the most powerful compact router MikroTik has ever made. Equipped with a quad-core ARM CPU, 1GB RAM, a 2.5 Gigabit Ethernet port, seven Gigabit Ethernet ports, and a 10Gbps SFP+ cage.\n\n**Enterprise-grade for large-scale operations.** Ideal for ISP headends, large offices, and data centers.\n\n**Key advantages:**\n- 2.5G uplink for fast internet connections\n- 10Gbps SFP+ for fiber or backbone links\n- Can handle 500+ concurrent users\n- Full metal case for rack mounting\n- PoE-in capable on port 1',
  250000000,
  290000000,
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
  E'CPU: Quad-core 1.4GHz ARM\nRAM: 1GB DDR3\nStorage: 1GB flash\nEthernet: 7x Gigabit + 1x 2.5G\nSFP+: 1x 10Gbps\nDimensions: 228x124x30mm\nWeight: 780g\nPower: 12V-2A (802.3at PoE in)',
  'RouterOS v7,Hotspot Portal,Simple Queue,Firewall,VPN,2.5G Ethernet,10G SFP+,Enterprise',
  5,
  true,
  false,
  'blogpost-002',
  'prodcat-003',
  NOW(),
  NOW()
);

-- Update category product counts (optional, for display)
UPDATE "blog_categories" SET "name" = "name"; -- trigger updated_at
UPDATE "product_categories" SET "name" = "name";
