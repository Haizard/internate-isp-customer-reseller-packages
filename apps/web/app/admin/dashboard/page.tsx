"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";

interface PlatformOverview {
  isps: number;
  resellers: number;
  locations: number;
  routers: number;
  customers: number;
  activeCustomers: number;
  users: number;
  vouchers: number;
  mrrCents: number;
}

export default function AdminDashboard() {
  const overview = useApi<PlatformOverview>("/organizations/platform-overview");

  if (overview.loading) return <LoadingState />;
  if (overview.error || !overview.data) {
    return <ErrorState message={overview.error ?? "Failed to load platform overview"} />;
  }

  const s = overview.data;

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="NetMaster network across all ISPs" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="ISPs" value={s.isps} icon={<Icon name="router" />} accent="blue" />
        <StatCard label="Resellers" value={s.resellers} icon={<Icon name="users" />} accent="purple" />
        <StatCard label="Customers" value={s.customers} icon={<Icon name="users" />} accent="teal" />
        <StatCard
          label="Platform MRR"
          value={formatCents(s.mrrCents)}
          icon={<Icon name="credit" />}
          accent="green"
          sub={`${s.activeCustomers} active subscriptions`}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-medium text-text-secondary">Routers</p>
            <Icon name="router" size={18} />
          </div>
          <p className="text-title-1 font-bold">{s.routers}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-medium text-text-secondary">Locations</p>
            <Icon name="location" size={18} />
          </div>
          <p className="text-title-1 font-bold">{s.locations}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-medium text-text-secondary">Vouchers issued</p>
            <Icon name="ticket" size={18} />
          </div>
          <p className="text-title-1 font-bold">{s.vouchers}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-medium text-text-secondary">Platform users</p>
            <Icon name="users" size={18} />
          </div>
          <p className="text-title-1 font-bold">{s.users}</p>
        </Card>
      </div>
    </div>
  );
}
