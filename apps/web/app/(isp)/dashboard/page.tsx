"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { ListRow } from "@/components/ui/ListRow";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/format";
import Link from "next/link";

interface Overview {
  resellers: number;
  locations: number;
  routers: number;
  customers: number;
  activeCustomers: number;
  mrrCents: number;
}

interface Reseller {
  id: string;
  name: string;
  status: string;
  _count?: { locations: number; customers: number };
}

export default function IsDashboard() {
  const overview = useApi<Overview>("/organizations/overview", [], 30_000);
  const resellers = useApi<Reseller[]>("/organizations/resellers", [], 30_000);

  if (overview.loading || resellers.loading) return <LoadingState />;
  if (overview.error || resellers.error) return <ErrorState message={overview.error ?? resellers.error ?? "Error"} />;

  const stats = overview.data!;
  const resellerList = resellers.data ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Network overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Resellers" value={stats.resellers} icon={<Icon name="users" />} accent="blue" />
        <StatCard label="Customers" value={stats.customers} icon={<Icon name="users" />} accent="purple" />
        <StatCard label="Routers" value={stats.routers} icon={<Icon name="router" />} accent="teal" />
        <StatCard label="MRR" value={formatCents(stats.mrrCents)} icon={<Icon name="credit" />} accent="green" sub={`${stats.activeCustomers} active subscriptions`} />
      </div>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-title-3 font-semibold">Resellers</h2>
          <Link href="/resellers" className="text-footnote text-accent-blue font-semibold">
            View all
          </Link>
        </div>
        {resellerList.length === 0 ? (
          <p className="px-4 py-6 text-footnote text-text-tertiary">No resellers yet</p>
        ) : (
          resellerList.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.name}
                subtitle={`${r._count?.locations ?? 0} locations · ${r._count?.customers ?? 0} customers`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-accent-purple/15 text-accent-purple flex items-center justify-center">
                    <Icon name="users" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={r.status} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
