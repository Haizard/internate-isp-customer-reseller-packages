"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { BarChart } from "@/components/charts/BarChart";
import { formatBytes } from "@/lib/format";

interface UsageRecord {
  id: string;
  day: string;
  bytesUsed: string;
}

export default function UsagePage() {
  const { data, loading, error, reload } = useApi<UsageRecord[]>("/customers/me/usage");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const records = (data ?? []).map((r) => ({ ...r, bytesUsed: Number(r.bytesUsed) }));
  const total = records.reduce((sum, r) => sum + r.bytesUsed, 0);
  const chartData = records.map((r) => ({
    label: new Date(r.day).toLocaleDateString("en", { day: "numeric", month: "short" }),
    value: r.bytesUsed,
  }));

  return (
    <div>
      <PageHeader title="Usage" subtitle="Your data consumption this cycle" />

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="chart" size={18} className="text-accent-teal" />
          <h2 className="text-title-3 font-semibold">Daily usage</h2>
        </div>
        <p className="text-footnote text-text-secondary mb-4">Total this period: {formatBytes(total)}</p>
        <BarChart accent="#40C8E0" data={chartData} formatValue={formatBytes} />
      </Card>
    </div>
  );
}
