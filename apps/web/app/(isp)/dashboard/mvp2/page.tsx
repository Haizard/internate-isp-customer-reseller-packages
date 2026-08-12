"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatBytes, relativeTime } from "@/lib/format";

interface Router {
  id: string;
  name: string;
  status: string;
  location?: { name: string } | null;
}

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

interface QueryResult {
  status: string;
  message?: string;
  data: Record<string, unknown>;
}

interface CommandRecord {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
}

export default function Mvp2Page() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [state, setState] = useState<LifecycleState | null>(null);
  const [sessions, setSessions] = useState<QueryResult | null>(null);
  const [health, setHealth] = useState<QueryResult | null>(null);
  const [usage, setUsage] = useState<QueryResult | null>(null);
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRouter = useCallback(async (routerId: string) => {
    setError(null);
    try {
      const [lifecycle, sessionsRes, healthRes, usageRes, commandsRes] = await Promise.all([
        api.get<LifecycleState>(`/router-adapters/${routerId}/lifecycle`),
        api.get<QueryResult>(`/router-adapters/${routerId}/sessions`),
        api.get<QueryResult>(`/router-adapters/${routerId}/health`),
        api.get<QueryResult>(`/router-adapters/${routerId}/usage`),
        api.get<CommandRecord[]>(`/router-adapters/${routerId}/commands`),
      ]);
      setState(lifecycle);
      setSessions(sessionsRes);
      setHealth(healthRes);
      setUsage(usageRes);
      setCommands(commandsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load router adapter state");
    }
  }, []);

  useEffect(() => {
    api
      .get<Router[]>("/routers")
      .then((list) => {
        setRouters(list);
        if (list[0]) {
          setSelected(list[0].id);
          loadRouter(list[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load routers"));
  }, [loadRouter]);

  const activeRouter = routers.find((r) => r.id === selected);
  const usageByDay = (usage?.data?.usageByDay as { day: string; bytesUsed: number }[] | undefined) ?? [];
  const maxDayBytes = Math.max(1, ...usageByDay.map((d) => d.bytesUsed));

  return (
    <div className="space-y-6">
      <PageHeader
        title="MVP 2 gateway lifecycle"
        subtitle="Commands, desired-vs-applied reconciliation, sessions, health, and usage for each simulator-backed gateway."
      />

      {routers.length > 0 && (
        <div className="glass rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-text-secondary">Router</label>
          <select
            className="h-[44px] px-4 rounded-md bg-white/70 border border-white/60 text-body outline-none focus:ring-4 focus:ring-accent-blue/15 flex-1 min-w-[220px]"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              loadRouter(e.target.value);
            }}
          >
            {routers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.location?.name ?? "no location"}) · {r.status}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-accent-orange/25 bg-accent-orange/10 p-4 text-sm text-accent-orange">
          {error}
        </div>
      )}

      {!state && !error && (
        <div className="glass rounded-2xl p-6 text-sm text-text-secondary shadow-sm">Loading adapter lifecycle…</div>
      )}

      {state && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass card-tint card-tint-blue rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">Adapter status</h2>
              <dl className="mt-4 space-y-3 text-sm text-text-secondary">
                <div className="flex justify-between">
                  <dt>Router</dt>
                  <dd className="font-medium text-text-primary">{activeRouter?.name ?? state.routerId}</dd>
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
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0">Desired</dt>
                  <dd className="font-medium text-text-primary text-right break-all">{JSON.stringify(state.reconciliation.desiredJson)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0">Applied</dt>
                  <dd className="font-medium text-text-primary text-right break-all">{JSON.stringify(state.reconciliation.appliedJson)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass card-tint card-tint-teal rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">Sessions</h2>
              {sessions?.status === "OK" ? (
                <dl className="mt-4 space-y-3 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <dt>Active</dt>
                    <dd className="font-medium text-text-primary">{String(sessions.data.activeSessions ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Expired</dt>
                    <dd className="font-medium text-text-primary">{String(sessions.data.expiredSessions ?? 0)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-accent-red">{sessions?.message ?? "No session data"}</p>
              )}
            </div>

            <div className="glass card-tint card-tint-green rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">Health</h2>
              {health?.status === "OK" ? (
                <dl className="mt-4 space-y-3 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <dt>CPU</dt>
                    <dd className="font-medium text-text-primary">{String(health.data.cpuPercent)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Memory</dt>
                    <dd className="font-medium text-text-primary">{String(health.data.memoryPercent)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Uptime</dt>
                    <dd className="font-medium text-text-primary">
                      {(() => {
                        const seconds = Number(health.data.uptimeSeconds ?? 0);
                        const days = Math.floor(seconds / 86400);
                        const hours = Math.floor((seconds % 86400) / 3600);
                        return `${days}d ${hours}h`;
                      })()}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-accent-red">{health?.message ?? "No health data"}</p>
              )}
            </div>

            <div className="glass card-tint card-tint-orange rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">Usage (last 7 days)</h2>
              <div className="mt-4 space-y-2">
                {usageByDay.map((day) => (
                  <div key={day.day} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-text-secondary shrink-0">{day.day.slice(5)}</span>
                    <div className="flex-1 h-3 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
                        style={{ width: `${(day.bytesUsed / maxDayBytes) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-xs text-text-secondary text-right shrink-0">{formatBytes(day.bytesUsed)}</span>
                  </div>
                ))}
                {usageByDay.length === 0 && (
                  <p className="text-sm text-accent-red">{usage?.message ?? "No usage data"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">Command queue</h2>
            {commands.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">No commands recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {commands.map((cmd) => (
                  <div key={cmd.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/50 border border-white/60 px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-text-tertiary">{cmd.kind}</span>
                    <span className={`text-xs font-semibold ${cmd.status === "FAILED" ? "text-accent-red" : "text-accent-green"}`}>
                      {cmd.status}
                    </span>
                    <span className="text-xs text-text-tertiary">attempts {cmd.attempts}</span>
                    {cmd.lastError && <span className="text-xs text-accent-red flex-1 min-w-0 truncate">{cmd.lastError}</span>}
                    <span className="text-xs text-text-tertiary ml-auto">{relativeTime(cmd.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
