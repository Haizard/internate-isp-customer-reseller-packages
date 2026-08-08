"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";
import { BarChart } from "@/components/charts/BarChart";

interface ResellerSummary {
  id: string;
  name: string;
  status: string;
  customers: number;
  activeCustomers: number;
  locations: number;
}

interface PackagePopularity {
  name: string;
  count: number;
}

export default function ReportsPage() {
  const resellers = useApi<ResellerSummary[]>("/reports/resellers");
  const popularity = useApi<PackagePopularity[]>("/reports/packages");

  if (resellers.loading || popularity.loading) return <LoadingState />;
  if (resellers.error || popularity.error)
    return <ErrorState message={resellers.error ?? popularity.error ?? "Error"} />;

  const totalCustomers = (resellers.data ?? []).reduce((sum, r) => sum + r.customers, 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Customers per reseller & package popularity" />

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="chart" size={18} className="text-accent-blue" />
          <h2 className="text-title-3 font-semibold">Package Popularity</h2>
        </div>
        {popularity.data && popularity.data.length > 0 ? (
          <BarChart
            accent="#0A84FF"
            data={popularity.data.map((p) => ({ label: p.name, value: p.count }))}
            formatValue={(v) => `${v} subs`}
          />
        ) : (
          <p className="text-footnote text-text-tertiary">No subscriptions yet</p>
        )}
      </Card>

      {resellers.data && resellers.data.length > 0 ? (
        <Card className="p-1">
          <div className="px-4 pt-3 pb-1">
            <h2 className="text-title-3 font-semibold">Customers per Reseller</h2>
            <p className="text-footnote text-text-tertiary">{totalCustomers} total customers</p>
          </div>
          {resellers.data.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium">{r.name}</p>
                  <p className="text-footnote text-text-secondary">
                    {r.locations} locations · {r.activeCustomers} active of {r.customers} customers
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState label="No reseller data yet" />
      )}
    </div>
  );
}
