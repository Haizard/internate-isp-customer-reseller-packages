"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Sheet } from "@/components/ui/Sheet";

interface Reseller {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count?: { locations: number; customers: number };
}

export default function ResellersPage() {
  const { data, loading, error, reload } = useApi<Reseller[]>("/organizations/resellers");
  const [selected, setSelected] = useState<Reseller | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const resellers = data ?? [];

  async function setStatus(status: "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL") {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/organizations/${selected.id}/status`, { status });
      setSelected(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Resellers" subtitle="Approve, suspend, and manage reseller accounts" />

      {resellers.length === 0 ? (
        <EmptyState label="No resellers yet" />
      ) : (
        <Card className="p-1">
          {resellers.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.name}
                subtitle={`${r._count?.locations ?? 0} locations · ${r._count?.customers ?? 0} customers`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(191,90,242,0.15)] text-accent-purple flex items-center justify-center">
                    <Icon name="users" size={20} />
                  </div>
                }
                trailing={
                  <>
                    <StatusBadge status={r.status} />
                    <button
                      onClick={() => setSelected(r)}
                      className="text-text-tertiary hover:text-accent-blue"
                      aria-label="Manage"
                    >
                      <Icon name="chevronRight" size={20} />
                    </button>
                  </>
                }
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <p className="text-footnote text-text-tertiary">
                {new Date(selected.createdAt).toLocaleDateString()}
              </p>
            </div>

            {selected.status !== "ACTIVE" && (
              <Button fullWidth onClick={() => setStatus("ACTIVE")} disabled={busy}>
                Approve reseller
              </Button>
            )}
            {selected.status === "ACTIVE" && (
              <Button fullWidth variant="destructive" onClick={() => setStatus("SUSPENDED")} disabled={busy}>
                Suspend reseller
              </Button>
            )}
            {selected.status === "SUSPENDED" && (
              <Button fullWidth variant="secondary" onClick={() => setStatus("PENDING_APPROVAL")} disabled={busy}>
                Set back to pending
              </Button>
            )}
            <Button fullWidth variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
