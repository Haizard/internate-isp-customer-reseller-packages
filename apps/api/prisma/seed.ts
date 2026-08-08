import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding NetMaster demo dataset...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1 ISP org
  const isp = await prisma.organization.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "NexusNet Arusha",
      type: "ISP",
      status: "ACTIVE",
    },
  });

  // ISP Admin user
  await prisma.user.upsert({
    where: { email: "admin@nexusnet.co.tz" },
    update: {},
    create: {
      name: "Haitham Admin",
      email: "admin@nexusnet.co.tz",
      passwordHash,
      role: "ISP_ADMIN",
      organizationId: isp.id,
    },
  });

  // Platform owner
  await prisma.user.upsert({
    where: { email: "owner@netmaster.io" },
    update: {},
    create: {
      name: "Platform Owner",
      email: "owner@netmaster.io",
      passwordHash,
      role: "PLATFORM_OWNER",
      organizationId: isp.id,
    },
  });

  // 1 Reseller org (child of ISP)
  const reseller = await prisma.organization.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Amina Home Reseller",
      type: "RESELLER",
      parentOrgId: isp.id,
      status: "ACTIVE",
    },
  });

  // Reseller user
  await prisma.user.upsert({
    where: { email: "reseller@amina.co.tz" },
    update: {},
    create: {
      name: "Amina Hassan",
      email: "reseller@amina.co.tz",
      passwordHash,
      role: "RESELLER",
      organizationId: reseller.id,
    },
  });

  // 1 Location
  const location = await prisma.location.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      name: "Amina's Home",
      address: "Block D, Sekei, Arusha",
      organizationId: reseller.id,
    },
  });

  // 1 Router
  const router = await prisma.router.upsert({
    where: { macAddress: "A4:2B:B0:11:22:33" },
    update: {},
    create: {
      name: "GL-MT3000 Beryl AX",
      macAddress: "A4:2B:B0:11:22:33",
      status: "ACTIVE",
      locationId: location.id,
    },
  });

  // 2 Packages (owned by ISP)
  const pkg1 = await prisma.package.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      name: "Home Basic",
      speedMbps: 10,
      dataCapGb: 50,
      priceCents: 25000,
      currency: "TZS",
      organizationId: isp.id,
    },
  });
  const pkg2 = await prisma.package.upsert({
    where: { id: "00000000-0000-4000-8000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000005",
      name: "Home Pro",
      speedMbps: 25,
      dataCapGb: null,
      priceCents: 45000,
      currency: "TZS",
      organizationId: isp.id,
    },
  });

  // Bandwidth rule templates per package (stored only, no live enforcement in MVP)
  const bandwidthRules = [
    {
      id: "00000000-0000-4000-8000-000000000020",
      name: "Business Hours Throttle",
      downloadMbps: 10,
      uploadMbps: 5,
      priority: 1,
      packageId: pkg1.id,
    },
    {
      id: "00000000-0000-4000-8000-000000000021",
      name: "Off-Peak Boost",
      downloadMbps: 25,
      uploadMbps: 10,
      priority: 0,
      packageId: pkg1.id,
    },
    {
      id: "00000000-0000-4000-8000-000000000022",
      name: "Peak Time Priority",
      downloadMbps: 40,
      uploadMbps: 20,
      priority: 2,
      packageId: pkg2.id,
    },
  ];
  for (const rule of bandwidthRules) {
    await prisma.bandwidthRule.upsert({
      where: { id: rule.id },
      update: {},
      create: rule,
    });
  }

  // 3 Customers on the reseller's router
  const customers = [
    { id: "00000000-0000-4000-8000-000000000010", name: "John Mushi", phone: "255712000001", wifiSsid: "John_WiFi", wifiPassword: "john1234", status: "ACTIVE" as const, packageId: pkg1.id },
    { id: "00000000-0000-4000-8000-000000000011", name: "Neema Joseph", phone: "255713000002", wifiSsid: "Neema_WiFi", wifiPassword: "neema123", status: "ACTIVE" as const, packageId: pkg2.id },
    { id: "00000000-0000-4000-8000-000000000012", name: "Baraka Paul", phone: "255714000003", wifiSsid: "Baraka_WiFi", wifiPassword: "baraka12", status: "ACTIVE" as const, packageId: pkg1.id },
  ];

  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        wifiSsid: c.wifiSsid,
        wifiPassword: c.wifiPassword,
        status: c.status,
        routerId: router.id,
        organizationId: reseller.id,
      },
    });
    await prisma.subscription.upsert({
      where: { customerId: customer.id },
      update: { packageId: c.packageId },
      create: {
        customerId: customer.id,
        packageId: c.packageId,
      },
    });
    // Customer login user
    await prisma.user.upsert({
      where: { email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@customer.co.tz` },
      update: {},
      create: {
        name: c.name,
        email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@customer.co.tz`,
        passwordHash,
        role: "CUSTOMER",
        organizationId: reseller.id,
        customerId: customer.id,
      },
    });
    // Mock devices
    const deviceCount = await prisma.device.count({ where: { customerId: customer.id } });
    if (deviceCount === 0) {
      await prisma.device.createMany({
        data: [
          { customerId: customer.id, macAddress: `AA:11:22:33:44:${String(customers.indexOf(c) + 1)}0`, deviceName: "Samsung Galaxy", lastSeenAt: new Date(Date.now() - 5 * 60 * 1000) },
          { customerId: customer.id, macAddress: `BB:22:33:44:55:${String(customers.indexOf(c) + 1)}0`, deviceName: "Laptop", lastSeenAt: new Date(Date.now() - 20 * 60 * 1000) },
          { customerId: customer.id, macAddress: `CC:33:44:55:66:${String(customers.indexOf(c) + 1)}0`, deviceName: "Smart TV", lastSeenAt: new Date(Date.now() - 60 * 60 * 1000) },
        ],
      });
    }
    // Mock usage records (14 days)
    const usageCount = await prisma.usageRecord.count({ where: { customerId: customer.id } });
    if (usageCount === 0) {
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() - (13 - i));
        day.setHours(0, 0, 0, 0);
        const bytesUsed = BigInt((i * 7 + Math.floor(Math.random() * 12) + 8) * 1024 * 1024);
        await prisma.usageRecord.create({ data: { customerId: customer.id, day, bytesUsed } });
      }
    }
  }

  // 5 Vouchers
  const voucherCodes = ["ABCD-1234", "EFGH-5678", "JKLM-9012", "NOPQ-3456", "RSTU-7890"];
  const voucherCount = await prisma.voucher.count();
  if (voucherCount === 0) {
    await prisma.voucher.createMany({
      data: voucherCodes.map((code, i) => ({
        code,
        organizationId: reseller.id,
        dataGb: i % 2 === 0 ? 5 : null,
        durationHours: i % 2 === 0 ? null : 24,
        status: "UNUSED" as const,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      })),
    });
  }

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  ISP Admin:  admin@nexusnet.co.tz");
  console.log("  Reseller:   reseller@amina.co.tz");
  console.log("  Customer:   john.mushi@customer.co.tz");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
