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

interface Rule {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  priority: number;
}

const emptyForm = { name: "", speedMbps: 10, dataCapGb: null as number | null, priceCents: 25000 };

export default function PackagesPage() {
  const { data, loading, error, reload } = useApi<Pkg[]>("/packages");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleForm, setRuleForm] = useState({ name: "Default", downloadMbps: 10, uploadMbps: 5, priority: 0 });
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const packages = data ?? [];

  async function createPackage() {
    setBusy(true);
    try {
      if (editingId) await api.patch(`/packages/${editingId}`, form);
      else await api.post("/packages", form);
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function loadRules(packageId: string) {
    setSelectedPackageId(packageId);
    setRules(await api.get<Rule[]>(`/packages/${packageId}/rules`));
  }

  async function saveRule() {
    if (!selectedPackageId) return;
    await api.post(`/packages/${selectedPackageId}/rules`, ruleForm);
    setRules(await api.get<Rule[]>(`/packages/${selectedPackageId}/rules`));
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
                <button className="text-accent-blue font-semibold" onClick={() => loadRules(p.id)}>
                  Manage bandwidth rules
                </button>
              </div>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setEditingId(p.id);
                  setForm({ name: p.name, speedMbps: p.speedMbps, dataCapGb: p.dataCapGb, priceCents: p.priceCents });
                  setOpen(true);
                }}
              >
                Edit package
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedPackageId && (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-3 font-semibold">Bandwidth rules</h2>
            <Button variant="ghost" onClick={() => setSelectedPackageId(null)}>Close</Button>
          </div>
          <div className="space-y-2 mb-4">
            {rules.length === 0 ? <p className="text-footnote text-text-tertiary">No rules yet.</p> : rules.map((rule) => (
              <ListRow key={rule.id} title={rule.name} subtitle={`${rule.downloadMbps} Mbps down · ${rule.uploadMbps} Mbps up · priority ${rule.priority}`} />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
            <Field label="Download Mbps" type="number" value={ruleForm.downloadMbps} onChange={(e) => setRuleForm({ ...ruleForm, downloadMbps: Number(e.target.value) })} />
            <Field label="Upload Mbps" type="number" value={ruleForm.uploadMbps} onChange={(e) => setRuleForm({ ...ruleForm, uploadMbps: Number(e.target.value) })} />
            <Button className="self-end" onClick={saveRule}>Add rule</Button>
          </div>
        </Card>
      )}

      <Sheet open={open} onClose={() => { setOpen(false); setEditingId(null); }} title={editingId ? "Edit Package" : "New Package"}>
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
            {editingId ? "Save Package" : "Create Package"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
