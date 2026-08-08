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

interface Location {
  id: string;
  name: string;
  address: string | null;
  _count?: { routers: number };
}

export default function LocationsPage() {
  const { data, loading, error, reload } = useApi<Location[]>("/locations");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const locations = data ?? [];

  async function createLocation() {
    setBusy(true);
    try {
      await api.post("/locations", { name, address: address || null });
      setOpen(false);
      setName("");
      setAddress("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Sites where you serve customers"
        action={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">New Location</span>
          </Button>
        }
      />

      {locations.length === 0 ? (
        <EmptyState label="No locations yet" />
      ) : (
        <Card className="p-1">
          {locations.map((l, i) => (
            <div key={l.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={l.name}
                subtitle={l.address ?? `${l._count?.routers ?? 0} routers`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(191,90,242,0.15)] text-accent-purple flex items-center justify-center">
                    <Icon name="location" size={20} />
                  </div>
                }
                trailing={
                  <span className="text-footnote text-text-secondary">{l._count?.routers ?? 0} routers</span>
                }
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New Location">
        <div className="space-y-4">
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Home / Shop / Block" />
          <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, Area, City" />
          <Button fullWidth onClick={createLocation} disabled={busy || !name}>
            Create Location
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
