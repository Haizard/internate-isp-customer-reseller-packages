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
        <div className="rounded-2xl border border-accent-orange/25 bg-accent-orange/10 p-4 text-sm text-accent-orange">
          {error}
        </div>
      ) : null}

      {state ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass card-tint card-tint-blue rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">Adapter status</h2>
            <dl className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="flex justify-between">
                <dt>Router</dt>
                <dd className="font-medium text-text-primary">{state.routerId}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Adapter</dt>
                <dd className="font-medium text-text-primary">{state.adapterKind}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Pending commands</dt>
                <dd className="font-medium text-text-primary">{state.pendingCommands}</dd>
              </div>
            </dl>
          </div>

          <div className="glass card-tint card-tint-purple rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">Reconciliation</h2>
            <dl className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="font-medium text-text-primary">{state.reconciliation.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Desired</dt>
                <dd className="font-medium text-text-primary">{JSON.stringify(state.reconciliation.desiredJson)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Applied</dt>
                <dd className="font-medium text-text-primary">{JSON.stringify(state.reconciliation.appliedJson)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 text-sm text-text-secondary shadow-sm">
          Loading adapter lifecycle...
        </div>
      )}
    </div>
  );
}
