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

interface Router {
  id: string;
  name: string;
  macAddress: string;
  status: string;
  location?: { id: string; name: string };
  customerCount?: number;
}

interface Location {
  id: string;
  name: string;
}

export default function RoutersPage() {
  const { data, loading, error, reload } = useApi<Router[]>("/routers");
  const locations = useApi<Location[]>("/locations");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", macAddress: "", locationId: "" });
  const [busy, setBusy] = useState(false);

  if (loading || locations.loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const routers = data ?? [];

  async function createRouter() {
    setBusy(true);
    try {
      await api.post("/routers", form);
      setOpen(false);
      setForm({ name: "", macAddress: "", locationId: "" });
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Routers"
        subtitle="Simulated gateways — no real device pairing in MVP"
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Router</span>
          </Button>
        }
      />

      {routers.length === 0 ? (
        <EmptyState label="No routers yet" />
      ) : (
        <Card className="p-1">
          {routers.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.name}
                subtitle={`${r.location?.name ?? "—"} · ${r.macAddress} · ${r.customerCount ?? 0} customers`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(64,200,224,0.15)] text-accent-teal flex items-center justify-center">
                    <Icon name="router" size={20} />
                  </div>
                }
                trailing={<StatusBadge status={r.status} />}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Router">
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="GL-MT3000" />
          <Field label="MAC Address" value={form.macAddress} onChange={(e) => setForm({ ...form, macAddress: e.target.value })} placeholder="A4:2B:B0:00:00:01" />
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Location</label>
            <select
              className="w-full h-[44px] px-4 rounded-md bg-white/60 border border-white/60 text-body outline-none focus:focus-ring"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            >
              <option value="">Select location</option>
              {(locations.data ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <Button fullWidth onClick={createRouter} disabled={busy || !form.name || !form.macAddress || !form.locationId}>
            Create Router
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
