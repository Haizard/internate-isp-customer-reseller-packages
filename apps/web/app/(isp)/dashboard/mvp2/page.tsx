"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";

interface LifecycleState {
  routerId: string;
  adapterKind: string;
  pendingCommands: number;
  reconciliation: {
    id: string;
    status: string;
    desiredJson: Record<string, unknown>;
    appliedJson: Record<string, unknown>;
  };
}

export default function Mvp2Page() {
  const [state, setState] = useState<LifecycleState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<LifecycleState>("/router-adapters/router-1/lifecycle");
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lifecycle state");
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="MVP 2 gateway lifecycle"
        subtitle="View pending commands and desired-vs-applied reconciliation state for the gateway adapter."
      />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      {state ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Adapter status</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Router</dt>
                <dd className="font-medium text-slate-900">{state.routerId}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Adapter</dt>
                <dd className="font-medium text-slate-900">{state.adapterKind}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Pending commands</dt>
                <dd className="font-medium text-slate-900">{state.pendingCommands}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Reconciliation</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="font-medium text-slate-900">{state.reconciliation.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Desired</dt>
                <dd className="font-medium text-slate-900">{JSON.stringify(state.reconciliation.desiredJson)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Applied</dt>
                <dd className="font-medium text-slate-900">{JSON.stringify(state.reconciliation.appliedJson)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/60 bg-white/60 p-6 text-sm text-slate-600 shadow-sm backdrop-blur">
          Loading adapter lifecycle...
        </div>
      )}
    </div>
  );
}
