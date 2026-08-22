"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";

interface Overview {
  resellers: number;
  locations: number;
  routers: number;
  customers: number;
  activeCustomers: number;
  mrrCents: number;
}

interface Earning {
  id: string;
  name: string;
  activeCustomers: number;
  monthlyRevenueCents: number;
}

export default function ResellerDashboard() {
  const overview = useApi<Overview>("/organizations/overview", [], 30_000);
  const earnings = useApi<Earning[]>("/reports/earnings", [], 30_000);

  if (overview.loading || earnings.loading) return <LoadingState />;
  if (overview.error || earnings.error)
    return <ErrorState message={overview.error ?? earnings.error ?? "Error"} />;

  const stats = overview.data!;
  const myEarnings = earnings.data ?? [];
  const myEarning = myEarnings[0];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your reseller network overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          label="Customers"
          value={stats.customers}
          icon={<Icon name="users" />}
          accent="teal"
          sub={`${stats.activeCustomers} active`}
        />
        <StatCard
          label="Routers"
          value={stats.routers}
          icon={<Icon name="router" />}
          accent="blue"
        />
        <StatCard
          label="Locations"
          value={stats.locations}
          icon={<Icon name="location" />}
          accent="purple"
        />
        <StatCard
          label="MRR"
          value={formatCents(stats.mrrCents)}
          icon={<Icon name="credit" />}
          accent="green"
          sub={`${stats.activeCustomers} active subscriptions`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="chart" size={18} className="text-accent-purple" />
            <h2 className="text-title-3 font-semibold">Revenue</h2>
          </div>
          <div className="space-y-3">
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Monthly Revenue</p>
              <p className="text-title-1 font-bold text-accent-green">
                {formatCents(myEarning?.monthlyRevenueCents ?? 0)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Active Customers</p>
                <p className="text-title-2 font-bold">{myEarning?.activeCustomers ?? 0}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Avg per Customer</p>
                <p className="text-title-2 font-bold">
                  {formatCents(
                    myEarning && myEarning.activeCustomers > 0
                      ? Math.round(myEarning.monthlyRevenueCents / myEarning.activeCustomers)
                      : 0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="router" size={18} className="text-accent-blue" />
            <h2 className="text-title-3 font-semibold">Network</h2>
          </div>
          <div className="space-y-3">
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Total Locations</p>
              <p className="text-title-2 font-bold">{stats.locations}</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Total Routers</p>
              <p className="text-title-2 font-bold">{stats.routers}</p>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">Total Customers</p>
              <p className="text-title-2 font-bold">{stats.customers}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
