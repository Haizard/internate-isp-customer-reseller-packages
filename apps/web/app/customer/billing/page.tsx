"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatCents, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { useState } from "react";

interface Customer {
  subscription?: {
    package?: { name: string; priceCents: number; currency: string; speedMbps: number };
    startedAt: string;
    renewsAt: string | null;
  } | null;
  status: string;
}

interface TicketView {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  comments?: { body: string; authorRole: string; isInternal: boolean; createdAt: string }[];
}

export default function BillingPage() {
  const { data, loading, error, reload } = useApi<Customer>("/customers/me");
  const requests = useApi<TicketView[]>("/customers/me/requests");
  const [sent, setSent] = useState(false);

  if (loading || requests.loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const pkg = data?.subscription?.package;

  async function requestUpgrade() {
    await api.post("/customers/me/requests", {
      type: "UPGRADE",
      message: "Please contact me about upgrading to a faster package",
    });
    setSent(true);
    requests.reload();
  }

  return (
    <div>
      <PageHeader title="Billing" subtitle="Your package & payment status" />

      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-footnote text-text-secondary">Current plan</p>
            <p className="text-title-1 font-bold">{pkg?.name ?? "No package"}</p>
            {pkg && (
              <p className="text-callout text-text-secondary mt-1">
                {pkg.speedMbps} Mbps · {formatCents(pkg.priceCents, pkg.currency)}/month
              </p>
            )}
          </div>
          <StatusBadge status={data?.status ?? "ACTIVE"} />
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={requestUpgrade} disabled={sent}>
            {sent ? "Request sent" : "Request Upgrade"}
          </Button>
        </div>
      </Card>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">My Requests</h2>
        </div>
        {(requests.data ?? []).length === 0 ? (
          <EmptyState label="No requests yet" />
        ) : (
          (requests.data ?? []).map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.subject}
                subtitle={`${r.priority.toLowerCase()} · ${formatDate(r.createdAt)} · ${r.comments?.filter((c) => !c.isInternal).length ?? 0} replies`}
                leading={
                  <div className="w-9 h-9 rounded-full bg-[rgba(255,159,10,0.15)] text-accent-orange flex items-center justify-center">
                    <Icon name="ticket" size={18} />
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
