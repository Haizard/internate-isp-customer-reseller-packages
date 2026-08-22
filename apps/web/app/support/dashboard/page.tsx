"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PriorityRow {
  priority: string;
  _count: { _all: number };
}

interface DashboardStats {
  open: number;
  atRisk: number;
  myQueue: number;
  byPriority: PriorityRow[];
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  slaResolveBy: string | null;
  assignee?: { name: string } | null;
}

export default function SupportDashboard() {
  const router = useRouter();
  const stats = useApi<DashboardStats>("/tickets/dashboard", [], 30_000);
  const tickets = useApi<Ticket[]>("/tickets", [], 30_000);

  if (stats.loading || tickets.loading) return <LoadingState />;
  if (stats.error || tickets.error)
    return <ErrorState message={stats.error ?? tickets.error ?? "Error"} />;

  const s = stats.data!;
  const recent = (tickets.data ?? []).slice(0, 5);
  const priorityLabel = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

  return (
    <div>
      <PageHeader title="Support" subtitle="Helpdesk queue overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Open tickets" value={s.open} icon={<Icon name="ticket" />} accent="orange" />
        <StatCard label="SLA at risk" value={s.atRisk} icon={<Icon name="alert" />} accent="red" />
        <StatCard label="My queue" value={s.myQueue} icon={<Icon name="users" />} accent="blue" />
        <StatCard
          label="Unassigned"
          value={(tickets.data ?? []).filter((t) => !t.assignee && t.status !== "RESOLVED" && t.status !== "CLOSED").length}
          icon={<Icon name="box" />}
          accent="gray"
        />
      </div>

      <Card className="p-1 mb-4">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">Open by priority</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pb-4">
          {(s.byPriority ?? []).map((row) => (
            <div key={row.priority} className="glass rounded-lg p-3">
              <p className="text-caption text-text-tertiary">{priorityLabel(row.priority)}</p>
              <p className="text-title-2 font-bold">{row._count._all}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-title-3 font-semibold">Recent tickets</h2>
          <Link href="/support/tickets" className="text-footnote text-accent-orange font-semibold">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState label="No tickets yet" />
        ) : (
          recent.map((t, i) => (
            <div key={t.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={t.subject}
                subtitle={`${priorityLabel(t.priority)} · ${t.assignee?.name ?? "Unassigned"}`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={18} />
                  </div>
                }
                trailing={<StatusBadge status={t.status} />}
                onClick={() => router.push(`/support/tickets?id=${t.id}`)}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
