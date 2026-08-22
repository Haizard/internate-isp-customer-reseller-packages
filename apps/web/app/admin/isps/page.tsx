"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

interface ISP {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count?: { users: number; locations: number };
}

export default function IspsPage() {
  const { data, loading, error, reload } = useApi<ISP[]>("/organizations?type=ISP");
  const [selected, setSelected] = useState<ISP | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isps = data ?? [];

  async function createISP() {
    setBusy(true);
    setCreateError(null);
    try {
      await api.post("/organizations", { name, type: "ISP" });
      setCreateOpen(false);
      setName("");
      reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create ISP");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
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

  const activeCount = isps.filter((i) => i.status === "ACTIVE").length;
  const pendingCount = isps.filter((i) => i.status === "PENDING_APPROVAL").length;

  return (
    <div>
      <PageHeader
        title="ISPs"
        subtitle={`${isps.length} ISPs · ${activeCount} active · ${pendingCount} pending`}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New ISP</span>
          </Button>
        }
      />

      {isps.length === 0 ? (
        <EmptyState label="No ISPs yet — create one to get started" />
      ) : (
        <Card className="p-1">
          {isps.map((isp, i) => (
            <div key={isp.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={isp.name}
                subtitle={`${isp._count?.locations ?? 0} locations · ${isp._count?.users ?? 0} users · Created ${new Date(isp.createdAt).toLocaleDateString()}`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(10,132,255,0.15)] text-accent-blue flex items-center justify-center">
                    <Icon name="router" size={20} />
                  </div>
                }
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={isp.status} />
                    <button
                      onClick={() => setSelected(isp)}
                      className="text-text-tertiary hover:text-accent-blue"
                      aria-label="Manage"
                    >
                      <Icon name="chevronRight" size={20} />
                    </button>
                  </div>
                }
                onClick={() => setSelected(isp)}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? "ISP"}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <p className="text-footnote text-text-tertiary">
                Created {new Date(selected.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Locations</p>
                <p className="text-body font-semibold">{selected._count?.locations ?? 0}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-caption text-text-tertiary">Users</p>
                <p className="text-body font-semibold">{selected._count?.users ?? 0}</p>
              </div>
            </div>

            <div className="space-y-2">
              {selected.status !== "ACTIVE" && (
                <Button fullWidth onClick={() => setStatus("ACTIVE")} disabled={busy}>
                  Approve ISP
                </Button>
              )}
              {selected.status === "ACTIVE" && (
                <Button fullWidth variant="destructive" onClick={() => setStatus("SUSPENDED")} disabled={busy}>
                  Suspend ISP
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
          </div>
        )}
      </Sheet>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New ISP">
        <div className="space-y-4">
          <Field
            label="ISP Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. NexusNet ISP"
          />
          {createError && <p className="text-footnote text-accent-red">{createError}</p>}
          <Button fullWidth onClick={createISP} disabled={busy || !name.trim()}>
            Create ISP
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
