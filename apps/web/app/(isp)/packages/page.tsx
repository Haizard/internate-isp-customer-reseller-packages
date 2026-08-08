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
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";

interface Pkg {
  id: string;
  name: string;
  speedMbps: number;
  dataCapGb: number | null;
  priceCents: number;
  currency: string;
}

const emptyForm = { name: "", speedMbps: 10, dataCapGb: null as number | null, priceCents: 25000 };

export default function PackagesPage() {
  const { data, loading, error, reload } = useApi<Pkg[]>("/packages");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const packages = data ?? [];

  async function createPackage() {
    setBusy(true);
    try {
      await api.post("/packages", form);
      setOpen(false);
      setForm(emptyForm);
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Packages"
        subtitle="Internet packages & bandwidth rules"
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Package</span>
          </Button>
        }
      />

      {packages.length === 0 ? (
        <EmptyState label="No packages yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {packages.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-title-3 font-semibold">{p.name}</p>
                  <p className="text-callout text-text-secondary mt-1">
                    {p.speedMbps} Mbps · {p.dataCapGb ? `${p.dataCapGb} GB cap` : "Unlimited data"}
                  </p>
                </div>
                <p className="text-title-3 font-bold text-accent-blue">{formatCents(p.priceCents, p.currency)}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-caption text-text-tertiary">
                <Icon name="router" size={14} />
                Bandwidth rule template stored
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Package">
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Home Pro" />
          <Field
            label="Speed (Mbps)"
            type="number"
            value={form.speedMbps}
            onChange={(e) => setForm({ ...form, speedMbps: Number(e.target.value) })}
          />
          <Field
            label="Data cap (GB) — leave 0 for unlimited"
            type="number"
            value={form.dataCapGb ?? 0}
            onChange={(e) => setForm({ ...form, dataCapGb: Number(e.target.value) || null })}
          />
          <Field
            label="Price (TZS)"
            type="number"
            value={form.priceCents}
            onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
          />
          <Button fullWidth onClick={createPackage} disabled={busy || !form.name}>
            Create Package
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
