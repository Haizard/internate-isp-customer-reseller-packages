import { prisma } from "../../prisma/client";

export class ReportsService {
  async resellerSummary(orgIds: string[]) {
    const resellers = await prisma.organization.findMany({
      where: { id: { in: orgIds }, type: "RESELLER" },
      include: {
        customers: { select: { id: true, status: true } },
        locations: { select: { id: true } },
      },
    });
    return resellers.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      customers: r.customers.length,
      activeCustomers: r.customers.filter((c) => c.status === "ACTIVE").length,
      locations: r.locations.length,
    }));
  }

  async packagePopularity(orgIds: string[]) {
    const subs = await prisma.subscription.findMany({
      where: { package: { organizationId: { in: orgIds } } },
      include: { package: true },
    });
    const map = new Map<string, { name: string; count: number }>();
    for (const s of subs) {
      const entry = map.get(s.packageId) ?? { name: s.package.name, count: 0 };
      entry.count += 1;
      map.set(s.packageId, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  async earningsByReseller(orgIds: string[]) {
    const resellers = await prisma.organization.findMany({
      where: { id: { in: orgIds }, type: "RESELLER" },
      include: {
        customers: {
          where: { deletedAt: null, status: "ACTIVE" },
          include: { subscription: { include: { package: true } } },
        },
      },
    });
    return resellers.map((r) => {
      const monthly = r.customers.reduce((sum, c) => sum + (c.subscription?.package.priceCents ?? 0), 0);
      return {
        id: r.id,
        name: r.name,
        activeCustomers: r.customers.length,
        monthlyRevenueCents: monthly,
      };
    });
  }
}
