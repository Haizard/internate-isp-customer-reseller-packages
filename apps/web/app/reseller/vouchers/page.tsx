"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/format";

interface Voucher {
  id: string;
  code: string;
  dataGb: number | null;
  durationHours: number | null;
  status: string;
  expiresAt: string | null;
  location?: { id: string; name: string } | null;
}

interface Location {
  id: string;
  name: string;
}

export default function VouchersPage() {
  const [locationFilter, setLocationFilter] = useState("");
  const { data, loading, error, reload } = useApi<Voucher[]>(locationFilter ? `/vouchers?locationId=${locationFilter}` : "/vouchers");
  const locations = useApi<Location[]>("/locations");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ count: 5, dataGb: 5, durationHours: 0, expiresInDays: 3, locationId: "" });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (loading || locations.loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const vouchers = data ?? [];

  async function generateBatch() {
    setBusy(true);
    try {
      await api.post("/vouchers/batch", {
        count: form.count,
        dataGb: form.dataGb > 0 ? form.dataGb : null,
        durationHours: form.durationHours > 0 ? form.durationHours : null,
        expiresInDays: form.expiresInDays > 0 ? form.expiresInDays : undefined,
        locationId: form.locationId || undefined,
      });
      setOpen(false);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/vouchers/${id}/status`, { status });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Vouchers"
        subtitle="Generate data & time vouchers to sell to customers"
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">Generate Vouchers</span>
          </Button>
        }
      />

      {(locations.data ?? []).length > 0 && (
        <div className="mb-4">
          <select
            className="h-[44px] px-3 rounded-md bg-white/70 border border-white/60 text-callout text-text-primary outline-none"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All locations</option>
            {(locations.data ?? []).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      {vouchers.length === 0 ? (
        <EmptyState label="No vouchers yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vouchers.slice(0, 24).map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between">
                <button
                  onClick={() => copyCode(v.code)}
                  className="font-mono text-title-3 font-bold tracking-widest text-accent-purple hover:opacity-70"
                >
                  {v.code}
                </button>
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-footnote text-text-secondary">
                <span>{v.dataGb ? `${v.dataGb} GB` : v.durationHours ? `${v.durationHours} hrs` : "Unlimited"}</span>
                {v.location && <><span>·</span><span className="text-accent-purple">{v.location.name}</span></>}
                <span>·</span>
                <span>Expires {formatDate(v.expiresAt)}</span>
              </div>
              {copied === v.code && (
                <p className="mt-2 text-caption text-accent-green font-semibold">Copied!</p>
              )}
              <Button variant="ghost" className="mt-2" onClick={() => updateStatus(v.id, v.status === "UNUSED" ? "USED" : "UNUSED")}>
                Mark {v.status === "UNUSED" ? "used" : "unused"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Generate Vouchers">
        <div className="space-y-4">
          {(locations.data ?? []).length > 0 && (
            <div>
              <label className="block text-footnote font-medium text-text-secondary mb-1.5">Assign to location (optional)</label>
              <select
                className="w-full h-[44px] px-4 rounded-md bg-white/60 border border-white/60 text-body outline-none focus:focus-ring"
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              >
                <option value="">All locations (shared)</option>
                {(locations.data ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <Field
            label="Number of vouchers"
            type="number"
            min={1}
            max={100}
            value={form.count}
            onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
          />
          <Field
            label="Data allowance (GB) — 0 for time voucher"
            type="number"
            value={form.dataGb}
            onChange={(e) => setForm({ ...form, dataGb: Number(e.target.value) })}
          />
          <Field
            label="Duration (hours) — 0 for data voucher"
            type="number"
            value={form.durationHours}
            onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
          />
          <Field
            label="Expires in (days)"
            type="number"
            value={form.expiresInDays}
            onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
          />
          <Button fullWidth onClick={generateBatch} disabled={busy}>
            Generate {form.count} Vouchers
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
