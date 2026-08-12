"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBytes, relativeTime } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Toggle } from "@/components/ui/SegmentedControl";
import { statusTone, Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";

interface RouterRef {
  id: string;
  name: string;
}

interface QueryResult {
  status: string;
  message?: string;
  data: Record<string, unknown>;
}

interface LifecycleState {
  adapterKind: string;
  pendingCommands: number;
  reconciliation: { status: string; desiredJson: Record<string, unknown> };
}

interface CommandRecord {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
}

interface RouterAdapterPanelProps {
  router: RouterRef | null;
  open: boolean;
  onClose: () => void;
}

type Tab = "overview" | "commands" | "actions";

export function RouterAdapterPanel({ router, open, onClose }: RouterAdapterPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<QueryResult | null>(null);
  const [health, setHealth] = useState<QueryResult | null>(null);
  const [usage, setUsage] = useState<QueryResult | null>(null);
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleState | null>(null);
  const [simulation, setSimulation] = useState<{ offline: boolean; expiry: boolean }>({ offline: false, expiry: false });

  const [queueName, setQueueName] = useState("");
  const [queueMbps, setQueueMbps] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!router) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, healthRes, usageRes, commandsRes, lifecycleRes] = await Promise.all([
        api.get<QueryResult>(`/router-adapters/${router.id}/sessions`),
        api.get<QueryResult>(`/router-adapters/${router.id}/health`),
        api.get<QueryResult>(`/router-adapters/${router.id}/usage`),
        api.get<CommandRecord[]>(`/router-adapters/${router.id}/commands`),
        api.get<LifecycleState>(`/router-adapters/${router.id}/lifecycle`),
      ]);
      setSessions(sessionsRes);
      setHealth(healthRes);
      setUsage(usageRes);
      setCommands(commandsRes);
      setLifecycle(lifecycleRes);
      const sim = (lifecycleRes.reconciliation.desiredJson as { simulation?: { offline?: boolean; expiry?: boolean } })
        ?.simulation;
      setSimulation({ offline: sim?.offline === true, expiry: sim?.expiry === true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load adapter state");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!open || !router) return;
    const timer = setTimeout(() => {
      setTab("overview");
      setMessage(null);
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [open, router, load]);

  if (!router) return null;

  const usageByDay = (usage?.data?.usageByDay as { day: string; bytesUsed: number }[] | undefined) ?? [];
  const maxDayBytes = Math.max(1, ...usageByDay.map((d) => d.bytesUsed));

  async function postAction(path: string, body?: unknown) {
    if (!router) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.post(path, body ?? {});
      setMessage("Done");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateSimulation(next: { offline?: boolean; expiry?: boolean }) {
    if (!router) return;
    const merged = { ...simulation, ...next };
    setSimulation(merged);
    await postAction(`/router-adapters/${router.id}/simulation`, { offline: merged.offline, expiry: merged.expiry });
  }

  function retryCommand(commandId: string) {
    if (!router) return;
    return postAction(`/router-adapters/${router.id}/commands/${commandId}/retry`);
  }

  return (
    <Sheet open={open} onClose={onClose} title={router.name}>
      <div className="space-y-4">
        <div className="flex rounded-pill p-1 gap-1 glass">
          {(["overview", "commands", "actions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-pill text-footnote font-semibold capitalize transition-all duration-[280ms] ${
                tab === t ? "bg-white text-accent-blue shadow-sm" : "text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {message && <p className="text-footnote text-accent-green">{message}</p>}
        {error && <p className="text-footnote text-accent-red">{error}</p>}

        {loading && !sessions ? (
          <LoadingState label="Loading adapter state…" />
        ) : tab === "overview" ? (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-footnote text-text-secondary">Adapter</span>
                <span className="text-body font-semibold text-text-primary">{lifecycle?.adapterKind ?? "simulator"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-footnote text-text-secondary">Sessions</span>
                <span className="text-body font-semibold text-text-primary">
                  {sessions?.status === "OK" ? String(sessions.data.activeSessions ?? 0) : sessions?.message ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-footnote text-text-secondary">CPU / Memory</span>
                <span className="text-body font-semibold text-text-primary">
                  {health?.status === "OK" ? `${health.data.cpuPercent}% / ${health.data.memoryPercent}%` : health?.message ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-footnote text-text-secondary">Pending commands</span>
                <span className="text-body font-semibold text-text-primary">{lifecycle?.pendingCommands ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-footnote text-text-secondary">Reconciliation</span>
                <Badge tone={statusTone(lifecycle?.reconciliation.status ?? "PENDING")}>
                  {lifecycle?.reconciliation.status ?? "PENDING"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-footnote font-medium text-text-secondary mb-2">Usage — last {usageByDay.length || 7} days</h3>
              <div className="space-y-2">
                {usageByDay.map((day) => (
                  <div key={day.day} className="flex items-center gap-2">
                    <span className="w-16 text-footnote text-text-secondary shrink-0">{day.day.slice(5)}</span>
                    <div className="flex-1 h-3 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-teal to-accent-purple"
                        style={{ width: `${(day.bytesUsed / maxDayBytes) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-footnote text-text-secondary text-right shrink-0">{formatBytes(day.bytesUsed)}</span>
                  </div>
                ))}
                {usageByDay.length === 0 && <p className="text-footnote text-accent-red">{usage?.message ?? "No usage data"}</p>}
              </div>
            </div>
          </div>
        ) : tab === "commands" ? (
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-footnote text-text-secondary">No commands recorded yet.</p>
            ) : (
              commands.map((cmd) => (
                <div key={cmd.id} className="rounded-xl bg-white/50 border border-white/60 px-3 py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-footnote text-text-tertiary">{cmd.kind}</span>
                    <Badge tone={statusTone(cmd.status)}>{cmd.status}</Badge>
                    <span className="text-footnote text-text-tertiary ml-auto">{relativeTime(cmd.createdAt)}</span>
                  </div>
                  {cmd.lastError && <p className="text-footnote text-accent-red">{cmd.lastError}</p>}
                  {cmd.status === "FAILED" && (
                    <Button size="md" variant="secondary" onClick={() => retryCommand(cmd.id)} disabled={busy} className="!h-8 !px-3 !text-footnote">
                      Retry
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-body font-semibold">Simulation</h3>
              <div className="rounded-xl bg-white/50 border border-white/60 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-body text-text-primary">Offline</div>
                  <div className="text-footnote text-text-secondary">Commands and reads fail — gateway unreachable</div>
                </div>
                <Toggle checked={simulation.offline} onChange={(v) => updateSimulation({ offline: v })} />
              </div>
              <div className="rounded-xl bg-white/50 border border-white/60 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-body text-text-primary">Expired sessions</div>
                  <div className="text-footnote text-text-secondary">Report one session as expired</div>
                </div>
                <Toggle checked={simulation.expiry} onChange={(v) => updateSimulation({ expiry: v })} />
              </div>
              <Button fullWidth variant="secondary" onClick={() => postAction(`/router-adapters/${router.id}/reconcile`)} disabled={busy}>
                Reconcile desired state
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Create queue</h3>
              <div className="flex gap-2">
                <Field label="Name" value={queueName} onChange={(e) => setQueueName(e.target.value)} placeholder="home-q" />
                <div className="w-28">
                  <Field label="Mbps" value={queueMbps} onChange={(e) => setQueueMbps(e.target.value)} placeholder="50" inputMode="numeric" />
                </div>
              </div>
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/queues`, {
                    name: queueName,
                    maxLimitMbps: Number(queueMbps) || undefined,
                    idempotencyKey: `queue-${queueName}`,
                  })
                }
                disabled={busy || !queueName}
              >
                Create Queue
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Manage user session</h3>
              <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="cust01" />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => postAction(`/router-adapters/${router.id}/disconnect`, { username, idempotencyKey: `disconnect-${username}` })}
                  disabled={busy || !username}
                >
                  Disconnect
                </Button>
                <Button
                  fullWidth
                  onClick={() => postAction(`/router-adapters/${router.id}/suspend`, { username, idempotencyKey: `suspend-${username}` })}
                  disabled={busy || !username}
                >
                  <Icon name="lock" size={16} />
                  Suspend
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
