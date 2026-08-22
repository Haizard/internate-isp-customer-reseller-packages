"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";
import { BarChart } from "@/components/charts/BarChart";
import { Button } from "@/components/ui/Button";

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

interface ServiceRequest {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  assignee?: { id: string; name: string } | null;
  requester?: { id: string; name: string } | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export default function ReportsPage() {
  const resellers = useApi<ResellerSummary[]>("/reports/resellers");
  const popularity = useApi<PackagePopularity[]>("/reports/packages");
  const requests = useApi<ServiceRequest[]>("/customers/requests");
  const auditLogs = useApi<AuditLog[]>("/reports/audit-logs");

  if (resellers.loading || popularity.loading || requests.loading || auditLogs.loading) return <LoadingState />;
  if (resellers.error || popularity.error || requests.error || auditLogs.error)
    return <ErrorState message={resellers.error ?? popularity.error ?? requests.error ?? auditLogs.error ?? "Error"} />;

  async function updateRequest(id: string, status: string) {
    await fetch(`/api/v1/customers/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("netmaster_token") ?? ""}` }, body: JSON.stringify({ status }) });
    requests.reload();
  }

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

      <Card className="p-1 mt-4">
        <div className="px-4 pt-3 pb-1"><h2 className="text-title-3 font-semibold">Service requests</h2></div>
        {(requests.data ?? []).map((request, i) => (
          <div key={request.id} className={i > 0 ? "hairline" : ""}>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1"><p className="text-body font-medium">{request.subject}</p><p className="text-footnote text-text-secondary">{request.description ?? "No description"} · {request.requester?.name ?? "Unknown"}</p></div>
              <Button variant="secondary" onClick={() => updateRequest(request.id, request.status === "OPEN" ? "IN_PROGRESS" : "CLOSED")}>{request.status === "OPEN" ? "Start" : request.status === "IN_PROGRESS" ? "Close" : "Closed"}</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-1 mt-4">
        <div className="px-4 pt-3 pb-1"><h2 className="text-title-3 font-semibold">Recent activity</h2></div>
        {(auditLogs.data ?? []).slice(0, 10).map((log, i) => (
          <div key={log.id} className={i > 0 ? "hairline" : ""}><div className="px-4 py-3"><p className="text-body font-medium">{log.action} {log.entityType}</p><p className="text-footnote text-text-secondary">{log.entityId} · {new Date(log.createdAt).toLocaleString()}</p></div></div>
        ))}
      </Card>
    </div>
  );
}
