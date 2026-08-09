"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";

interface ResellerStats {
  locations: number;
  routers: number;
  customers: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  status: string;
  subscription?: { package?: { priceCents: number; currency: string } } | null;
}

export default function ResellerDashboard() {
  const locations = useApi<unknown[]>("/locations");
  const routers = useApi<unknown[]>("/routers");
  const customers = useApi<Customer[]>("/customers");
  const earningsReport = useApi<{ id: string; monthlyRevenueCents: number }[]>("/reports/earnings");

  if (locations.loading || routers.loading || customers.loading || earningsReport.loading) return <LoadingState />;
  if (locations.error || routers.error || customers.error || earningsReport.error)
    return <ErrorState message={locations.error ?? routers.error ?? customers.error ?? earningsReport.error ?? "Error"} />;

  const customerList = customers.data ?? [];
  const activeCustomers = customerList.filter((c) => c.status === "ACTIVE");
  const earnings = earningsReport.data?.find((report) => report.monthlyRevenueCents >= 0)?.monthlyRevenueCents ?? activeCustomers.reduce(
    (sum, c) => sum + (c.subscription?.package?.priceCents ?? 0),
    0,
  );

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your reseller business at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Locations" value={locations.data?.length ?? 0} icon={<Icon name="location" />} accent="purple" />
        <StatCard label="Routers" value={routers.data?.length ?? 0} icon={<Icon name="router" />} accent="teal" />
        <StatCard label="Customers" value={customerList.length} icon={<Icon name="users" />} accent="blue" />
        <StatCard label="Monthly Earnings" value={formatCents(earnings)} icon={<Icon name="dollar" />} accent="green" />
      </div>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">Recent Customers</h2>
        </div>
        {customerList.length === 0 ? (
          <p className="px-4 py-6 text-footnote text-text-tertiary">No customers yet</p>
        ) : (
          customerList.slice(0, 5).map((c, i) => (
            <div key={c.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={c.name}
                subtitle={c.phone}
                leading={
                  <div className="w-9 h-9 rounded-full bg-[rgba(10,132,255,0.15)] text-accent-blue flex items-center justify-center">
                    <Icon name="users" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={c.status} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
