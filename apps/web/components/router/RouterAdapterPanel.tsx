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

interface CapabilitiesData {
  platform?: string;
  model?: string;
  firmware?: string | null;
  release?: string | null;
  architecture?: string | null;
  uptimeSeconds?: number;
  features?: Record<string, boolean>;
  supportedCommands?: Record<string, boolean>;
  supportedQueries?: Record<string, boolean>;
}

interface RouterAdapterPanelProps {
  router: RouterRef | null;
  open: boolean;
  onClose: () => void;
  onEnrolled?: () => void;
}

type Tab = "overview" | "capabilities" | "commands" | "actions";

type AdapterType = "simulator" | "mikrotik" | "openwrt";

const COMMAND_LABELS: Record<string, string> = {
  apply_profile: "Apply profile",
  create_user: "Create user",
  create_voucher: "Create voucher",
  disconnect_user: "Disconnect user",
  create_queue: "Create queue",
  create_pool: "Create pool",
  create_pppoe_profile: "Create PPPoE profile",
  create_hotspot_profile: "Create hotspot profile",
  heartbeat: "Heartbeat",
};

const FEATURE_LABELS: Record<string, string> = {
  chilli: "CoovaChilli hotspot",
  hostapd: "hostapd (WiFi)",
  tc: "tc traffic shaping",
  ubus: "ubus (OpenWrt bus)",
  qos: "qos-scripts",
  dnsmasq: "dnsmasq (DHCP)",
};

export function RouterAdapterPanel({ router, open, onClose, onEnrolled }: RouterAdapterPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<QueryResult | null>(null);
  const [health, setHealth] = useState<QueryResult | null>(null);
  const [usage, setUsage] = useState<QueryResult | null>(null);
  const [capabilities, setCapabilities] = useState<QueryResult | null>(null);
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleState | null>(null);
  const [simulation, setSimulation] = useState<{ offline: boolean; expiry: boolean }>({ offline: false, expiry: false });

  const [enrollType, setEnrollType] = useState<AdapterType>("openwrt");
  const [pairingCode, setPairingCode] = useState("");
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState("22");
  const [sshUsername, setSshUsername] = useState("root");
  const [sshPassword, setSshPassword] = useState("");

  const [profileName, setProfileName] = useState("");
  const [profileMbps, setProfileMbps] = useState("");
  const [profileDataGb, setProfileDataGb] = useState("");

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userProfile, setUserProfile] = useState("default");
  const [userExpiry, setUserExpiry] = useState("");

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDataGb, setVoucherDataGb] = useState("");
  const [voucherHours, setVoucherHours] = useState("24");

  const [queueName, setQueueName] = useState("");
  const [queueMbps, setQueueMbps] = useState("");

  const [poolName, setPoolName] = useState("");
  const [poolRanges, setPoolRanges] = useState("");

  const [pppoeName, setPppoeName] = useState("");
  const [pppoeLocal, setPppoeLocal] = useState("");
  const [pppoeRemote, setPppoeRemote] = useState("");
  const [pppoeRate, setPppoeRate] = useState("");

  const [hotspotName, setHotspotName] = useState("");
  const [hotspotKeepalive, setHotspotKeepalive] = useState("300");
  const [hotspotMaxSessions, setHotspotMaxSessions] = useState("");

  const [sessionUsername, setSessionUsername] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!router) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, healthRes, usageRes, capabilitiesRes, commandsRes, lifecycleRes] = await Promise.all([
        api.get<QueryResult>(`/router-adapters/${router.id}/sessions`),
        api.get<QueryResult>(`/router-adapters/${router.id}/health`),
        api.get<QueryResult>(`/router-adapters/${router.id}/usage`),
        api.get<QueryResult>(`/router-adapters/${router.id}/capabilities`).catch(() => null),
        api.get<CommandRecord[]>(`/router-adapters/${router.id}/commands`),
        api.get<LifecycleState>(`/router-adapters/${router.id}/lifecycle`),
      ]);
      setSessions(sessionsRes);
      setHealth(healthRes);
      setUsage(usageRes);
      setCapabilities(capabilitiesRes);
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
      setError(null);
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [open, router, load]);

  if (!router) return null;

  const caps = capabilities?.data as CapabilitiesData | undefined;
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
      onEnrolled?.();
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

  async function enroll() {
    if (!router) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        adapterType: enrollType,
        pairingCode: pairingCode || router.id,
      };
      if (enrollType === "openwrt" || enrollType === "mikrotik") {
        body.host = sshHost || undefined;
        body.port = sshPort ? Number(sshPort) : undefined;
        body.username = sshUsername || undefined;
        body.password = sshPassword || undefined;
      }
      await api.post(`/router-adapters/${router.id}/enroll`, body);
      setMessage(`Enrolled as ${enrollType}`);
      onEnrolled?.();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  const adapterKind = lifecycle?.adapterKind ?? "simulator";

  return (
    <Sheet open={open} onClose={onClose} title={router.name}>
      <div className="space-y-4">
        <div className="flex rounded-pill p-1 gap-1 glass">
          {(["overview", "capabilities", "commands", "actions"] as Tab[]).map((t) => (
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
                <span className="text-body font-semibold text-text-primary">{adapterKind}</span>
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
        ) : tab === "capabilities" ? (
          <div className="space-y-4">
            {capabilities?.status !== "OK" || !caps ? (
              <p className="text-footnote text-accent-red">
                {capabilities?.message ?? "Capabilities unavailable for this adapter."}
              </p>
            ) : (
              <>
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-footnote text-text-secondary">Platform</span>
                    <span className="text-body font-semibold text-text-primary">{caps.platform ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-footnote text-text-secondary">Model</span>
                    <span className="text-body font-semibold text-text-primary">{caps.model ?? "—"}</span>
                  </div>
                  {caps.firmware && (
                    <div className="flex items-center justify-between">
                      <span className="text-footnote text-text-secondary">Firmware</span>
                      <span className="text-body font-semibold text-text-primary">{caps.firmware}</span>
                    </div>
                  )}
                  {caps.architecture && (
                    <div className="flex items-center justify-between">
                      <span className="text-footnote text-text-secondary">Architecture</span>
                      <span className="text-body font-semibold text-text-primary">{caps.architecture}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-footnote font-medium text-text-secondary mb-2">Installed features</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                      const present = caps.features?.[key] === true;
                      return (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-caption font-medium ${
                            present ? "bg-accent-green/15 text-accent-green" : "bg-black/5 text-text-tertiary"
                          }`}
                        >
                          {present ? <Icon name="check" size={12} /> : <Icon name="x" size={12} />}
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-footnote font-medium text-text-secondary mb-2">Supported commands</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(caps.supportedCommands ?? {}).map(([key, ok]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-white/50 border border-white/60 px-3 py-2">
                        <span className="text-footnote text-text-secondary">{COMMAND_LABELS[key] ?? key}</span>
                        {ok ? (
                          <Icon name="check" size={14} className="text-accent-green" />
                        ) : (
                          <Icon name="x" size={14} className="text-accent-red" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
              <h3 className="text-body font-semibold">Enrollment</h3>
              <div className="space-y-1.5">
                <label className="block text-footnote font-medium text-text-secondary">Adapter type</label>
                <div className="flex gap-2">
                  {(["simulator", "mikrotik", "openwrt"] as AdapterType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEnrollType(t)}
                      className={`flex-1 h-9 rounded-pill text-footnote font-semibold transition-all duration-[280ms] ${
                        enrollType === t ? "bg-white text-accent-blue shadow-sm" : "bg-black/5 text-text-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Pairing code" value={pairingCode} onChange={(e) => setPairingCode(e.target.value)} placeholder="Auto (router id)" />
              {enrollType !== "simulator" && (
                <>
                  <div className="flex gap-2">
                    <Field label="Host" value={sshHost} onChange={(e) => setSshHost(e.target.value)} placeholder={enrollType === "openwrt" ? "192.168.1.1" : "192.168.88.1"} />
                    <div className="w-20">
                      <Field label="Port" value={sshPort} onChange={(e) => setSshPort(e.target.value)} placeholder="22" inputMode="numeric" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Field label="Username" value={sshUsername} onChange={(e) => setSshUsername(e.target.value)} placeholder={enrollType === "openwrt" ? "root" : "admin"} />
                    <Field label="Password" type="password" value={sshPassword} onChange={(e) => setSshPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </>
              )}
              <Button fullWidth onClick={enroll} disabled={busy}>
                Enroll router
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Apply profile</h3>
              <div className="flex gap-2">
                <Field label="Package name" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Fiber 50" />
                <div className="w-24">
                  <Field label="Mbps" value={profileMbps} onChange={(e) => setProfileMbps(e.target.value)} placeholder="50" inputMode="numeric" />
                </div>
                <div className="w-24">
                  <Field label="Data cap" value={profileDataGb} onChange={(e) => setProfileDataGb(e.target.value)} placeholder="GB" inputMode="numeric" />
                </div>
              </div>
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/profile`, {
                    packageName: profileName,
                    speedMbps: profileMbps ? Number(profileMbps) : undefined,
                    dataCapGb: profileDataGb ? Number(profileDataGb) : undefined,
                  })
                }
                disabled={busy || !profileName}
              >
                Apply profile
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Create user</h3>
              <div className="flex gap-2">
                <Field label="Username" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="cust01" />
                <Field label="Password" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Field label="Profile" value={userProfile} onChange={(e) => setUserProfile(e.target.value)} placeholder="default" />
                </div>
                <div className="flex-1">
                  <Field label="Expires at" type="datetime-local" value={userExpiry} onChange={(e) => setUserExpiry(e.target.value)} />
                </div>
              </div>
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/users`, {
                    username: userName,
                    password: userPassword || userName,
                    profileName: userProfile || undefined,
                    expiresAt: userExpiry ? new Date(userExpiry).toISOString() : undefined,
                  })
                }
                disabled={busy || !userName}
              >
                Create user
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Create voucher</h3>
              <div className="flex gap-2">
                <Field label="Code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="V1234" />
                <div className="w-24">
                  <Field label="Data GB" value={voucherDataGb} onChange={(e) => setVoucherDataGb(e.target.value)} placeholder="20" inputMode="numeric" />
                </div>
                <div className="w-24">
                  <Field label="Hours" value={voucherHours} onChange={(e) => setVoucherHours(e.target.value)} placeholder="24" inputMode="numeric" />
                </div>
              </div>
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/vouchers`, {
                    code: voucherCode,
                    dataGb: voucherDataGb ? Number(voucherDataGb) : undefined,
                    durationHours: voucherHours ? Number(voucherHours) : undefined,
                  })
                }
                disabled={busy || !voucherCode}
              >
                Create voucher
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
              <h3 className="text-body font-semibold">Create DHCP pool</h3>
              <div className="flex gap-2">
                <Field label="Name" value={poolName} onChange={(e) => setPoolName(e.target.value)} placeholder="lan-pool" />
              </div>
              <Field label="Range" value={poolRanges} onChange={(e) => setPoolRanges(e.target.value)} placeholder="192.168.88.100-192.168.88.200" />
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/pools`, {
                    name: poolName,
                    ranges: poolRanges,
                    idempotencyKey: `pool-${poolName}`,
                  })
                }
                disabled={busy || !poolName || !poolRanges}
              >
                Create pool
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Create PPPoE profile</h3>
              <Field label="Name" value={pppoeName} onChange={(e) => setPppoeName(e.target.value)} placeholder="pppoe-fiber" />
              <div className="flex gap-2">
                <Field label="Local address" value={pppoeLocal} onChange={(e) => setPppoeLocal(e.target.value)} placeholder="192.168.88.1" />
                <Field label="Remote range" value={pppoeRemote} onChange={(e) => setPppoeRemote(e.target.value)} placeholder="192.168.88.100-200" />
              </div>
              <Field label="Rate limit Mbps (optional)" value={pppoeRate} onChange={(e) => setPppoeRate(e.target.value)} placeholder="50" inputMode="numeric" />
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/pppoe-profiles`, {
                    name: pppoeName,
                    localAddress: pppoeLocal || undefined,
                    remoteAddress: pppoeRemote || undefined,
                    rateLimitMbps: pppoeRate ? Number(pppoeRate) : undefined,
                    idempotencyKey: `pppoe-${pppoeName}`,
                  })
                }
                disabled={busy || !pppoeName}
              >
                Create PPPoE profile
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Create hotspot profile</h3>
              <Field label="Name" value={hotspotName} onChange={(e) => setHotspotName(e.target.value)} placeholder="guest-wifi" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Field label="Keepalive (s)" value={hotspotKeepalive} onChange={(e) => setHotspotKeepalive(e.target.value)} placeholder="300" inputMode="numeric" />
                </div>
                <div className="flex-1">
                  <Field label="Max sessions" value={hotspotMaxSessions} onChange={(e) => setHotspotMaxSessions(e.target.value)} placeholder="Unlimited" inputMode="numeric" />
                </div>
              </div>
              <Button
                fullWidth
                onClick={() =>
                  postAction(`/router-adapters/${router.id}/hotspot-profiles`, {
                    name: hotspotName,
                    keepaliveTimeout: hotspotKeepalive ? Number(hotspotKeepalive) : undefined,
                    maxSessions: hotspotMaxSessions ? Number(hotspotMaxSessions) : undefined,
                    idempotencyKey: `hotspot-${hotspotName}`,
                  })
                }
                disabled={busy || !hotspotName}
              >
                Create hotspot profile
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-body font-semibold">Manage user session</h3>
              <Field label="Username" value={sessionUsername} onChange={(e) => setSessionUsername(e.target.value)} placeholder="cust01" />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => postAction(`/router-adapters/${router.id}/disconnect`, { username: sessionUsername, idempotencyKey: `disconnect-${sessionUsername}` })}
                  disabled={busy || !sessionUsername}
                >
                  Disconnect
                </Button>
                <Button
                  fullWidth
                  onClick={() => postAction(`/router-adapters/${router.id}/suspend`, { username: sessionUsername, idempotencyKey: `suspend-${sessionUsername}` })}
                  disabled={busy || !sessionUsername}
                >
                  <Icon name="lock" size={16} />
                  Suspend
                </Button>
              </div>
            </div>

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
          </div>
        )}
      </div>
    </Sheet>
  );
}
