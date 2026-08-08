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

interface Customer {
  id: string;
  name: string;
  phone: string;
  status: string;
  router?: { name: string };
  subscription?: { package?: { name: string } } | null;
}

interface Router {
  id: string;
  name: string;
}

interface Pkg {
  id: string;
  name: string;
}

export default function CustomersPage() {
  const { data, loading, error, reload } = useApi<Customer[]>("/customers");
  const routers = useApi<Router[]>("/routers");
  const packages = useApi<Pkg[]>("/packages");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", routerId: "", packageId: "" });
  const [busy, setBusy] = useState(false);

  if (loading || routers.loading || packages.loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const customers = data ?? [];

  async function createCustomer() {
    setBusy(true);
    try {
      await api.post("/customers", {
        name: form.name,
        phone: form.phone,
        routerId: form.routerId,
        ...(form.packageId ? { packageId: form.packageId } : {}),
      });
      setOpen(false);
      setForm({ name: "", phone: "", routerId: "", packageId: "" });
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Assign packages and routers to end customers"
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Customer</span>
          </Button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState label="No customers yet" />
      ) : (
        <Card className="p-1">
          {customers.map((c, i) => (
            <div key={c.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={c.name}
                subtitle={`${c.phone} · ${c.subscription?.package?.name ?? "No package"} · ${c.router?.name ?? "—"}`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(10,132,255,0.15)] text-accent-blue flex items-center justify-center">
                    <Icon name="users" size={20} />
                  </div>
                }
                trailing={<StatusBadge status={c.status} />}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Customer">
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Mushi" />
          <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="255712000000" />
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Router</label>
            <select
              className="w-full h-[44px] px-4 rounded-md bg-white/60 border border-white/60 text-body outline-none focus:focus-ring"
              value={form.routerId}
              onChange={(e) => setForm({ ...form, routerId: e.target.value })}
            >
              <option value="">Select router</option>
              {(routers.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-footnote font-medium text-text-secondary mb-1.5">Package</label>
            <select
              className="w-full h-[44px] px-4 rounded-md bg-white/60 border border-white/60 text-body outline-none focus:focus-ring"
              value={form.packageId}
              onChange={(e) => setForm({ ...form, packageId: e.target.value })}
            >
              <option value="">No package</option>
              {(packages.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button fullWidth onClick={createCustomer} disabled={busy || !form.name || !form.phone || !form.routerId}>
            Create Customer
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
