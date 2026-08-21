"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { RouterAdapterPanel } from "@/components/router/RouterAdapterPanel";

interface Router {
  id: string;
  name: string;
  macAddress: string;
  status: string;
  customerCount: number;
  location?: { id: string; name: string } | null;
}

interface Location {
  id: string;
  name: string;
  _count?: { routers: number };
}

interface LifecycleState {
  routerId: string;
  adapterKind: string;
  pendingCommands: number;
  reconciliation: { status: string };
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Router | null>(null);
  const [busy, setBusy] = useState(false);
  const [adapterKinds, setAdapterKinds] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [locationId, setLocationId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routerList, locationList] = await Promise.all([
        api.get<Router[]>("/routers"),
        api.get<Location[]>("/locations"),
      ]);
      setRouters(routerList);
      setLocations(locationList);

      const kinds: Record<string, string> = {};
      await Promise.all(
        routerList.map(async (r) => {
          try {
            const lifecycle = await api.get<LifecycleState>(`/router-adapters/${r.id}/lifecycle`);
            kinds[r.id] = lifecycle.adapterKind;
          } catch {
            kinds[r.id] = "simulator";
          }
        }),
      );
      setAdapterKinds(kinds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createRouter() {
    if (!name || !macAddress || !locationId) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/routers", { name, macAddress, locationId });
      setCreateOpen(false);
      setName("");
      setMacAddress("");
      setLocationId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create router");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && routers.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Routers"
        subtitle="Enroll and manage gateways for reseller locations"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={18} />
            New router
          </Button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-accent-orange/25 bg-accent-orange/10 p-4 text-sm text-accent-orange mb-4">
          {error}
        </div>
      )}

      {routers.length === 0 ? (
        <EmptyState label="No routers yet — add one to enroll a gateway" />
      ) : (
        <Card className="p-1">
          {routers.map((r, i) => (
            <div key={r.id} className={i > 0 ? "hairline" : ""}>
              <ListRow
                title={r.name}
                subtitle={`${r.location?.name ?? "no location"} · ${r.macAddress}`}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[rgba(64,200,224,0.15)] text-accent-teal flex items-center justify-center">
                    <Icon name="router" size={20} />
                  </div>
                }
                trailing={
                  <>
                    <span className="text-caption text-text-tertiary">{adapterKinds[r.id] ?? "simulator"}</span>
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
                onClick={() => setSelected(r)}
              />
            </div>
          ))}
        </Card>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New router">
        <div className="space-y-4">
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gateway A" />
          <Field label="MAC address" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="A4:2B:B0:00:00:01" />
          <div className="space-y-1.5">
            <label className="block text-footnote font-medium text-text-secondary">Location</label>
            <select
              className="w-full h-[44px] px-4 rounded-md bg-white/70 border border-[rgba(10,132,255,0.2)] text-body outline-none focus:ring-4 focus:ring-accent-blue/15"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Select a location…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <Button fullWidth onClick={createRouter} disabled={busy || !name || !macAddress || !locationId}>
            Create router
          </Button>
        </div>
      </Sheet>

      <RouterAdapterPanel
        router={selected ? { id: selected.id, name: selected.name } : null}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEnrolled={load}
      />
    </div>
  );
}
