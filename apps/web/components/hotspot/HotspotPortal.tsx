"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export interface HotspotVoucher {
  id: string;
  dataGb: number | null;
  durationHours: number | null;
  expiresAt: string | null;
}

export interface HotspotPackage {
  id: string;
  name: string;
  speedMbps: number;
  dataCapGb: number | null;
  priceCents: number;
  currency: string;
}

export interface HotspotData {
  slug: string;
  locationName: string;
  organization: { id: string; name: string; type: string };
  router: { id: string; name: string; status: string } | null;
  vouchers: HotspotVoucher[];
  packages: HotspotPackage[];
}

interface RedeemResult {
  redeemed: boolean;
  code: string;
  dataGb: number | null;
  durationHours: number | null;
  expiresAt: string | null;
  locationName: string;
  message: string;
}

interface HotspotPortalProps {
  hotspot: HotspotData;
}

export function HotspotPortal({ hotspot }: HotspotPortalProps) {
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<RedeemResult>(`/hotspot/${hotspot.slug}/redeem`, {
        code,
        deviceName: deviceName.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(64,200,224,0.15)] text-accent-teal flex items-center justify-center">
            <Icon name="check" size={26} />
          </div>
          <h2 className="text-title-2 font-semibold">Voucher Activated</h2>
          <p className="text-body text-text-secondary">
            {result.dataGb ? `${result.dataGb} GB` : "Unlimited"} ·{" "}
            {result.durationHours ? `${result.durationHours} hours` : "No expiry"}
          </p>
          <div className="w-full rounded-xl bg-white/70 border border-white/60 px-4 py-3 text-center">
            <div className="text-footnote text-text-secondary">Your code</div>
            <div className="text-title-2 font-mono font-semibold tracking-widest text-accent-teal">
              {result.code}
            </div>
          </div>
          <p className="text-footnote text-text-tertiary">Connect to the WiFi and the network will let you in.</p>
        </div>
        <Button fullWidth variant="secondary" onClick={() => setResult(null)}>
          Redeem another voucher
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="glass-strong rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[rgba(64,200,224,0.15)] text-accent-teal flex items-center justify-center shrink-0">
          <Icon name="wifi" size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-title-2 font-semibold truncate">{hotspot.router?.name ?? hotspot.locationName}</h1>
          <p className="text-footnote text-text-secondary truncate">
            {hotspot.organization.name} · {hotspot.locationName}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {hotspot.packages.map((pack) => (
          <div key={pack.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-body font-semibold text-text-primary truncate">{pack.name}</div>
              <div className="text-footnote text-text-secondary">
                {pack.speedMbps} Mbps · {pack.dataCapGb ? `${pack.dataCapGb} GB` : "Unlimited data"}
              </div>
            </div>
            <div className="shrink-0 text-body font-semibold text-accent-teal">
              {formatCents(pack.priceCents, pack.currency)}
            </div>
          </div>
        ))}
        {hotspot.packages.length === 0 && (
          <div className="glass rounded-xl px-4 py-3 text-footnote text-text-tertiary text-center">
            No plans listed yet.
          </div>
        )}
      </div>

      <div className="glass-strong rounded-2xl p-4 space-y-3">
        <h2 className="text-body font-semibold">Redeem your voucher</h2>
        <div className="space-y-3">
          <Field
            label="Voucher code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
            autoComplete="off"
          />
          <Field
            label="Device name (optional)"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="My phone"
          />
        </div>
        {error && <p className="text-footnote text-accent-red">{error}</p>}
        <Button fullWidth onClick={redeem} disabled={busy || !code.trim()}>
          {busy ? "Activating…" : "Activate Voucher"}
        </Button>
      </div>
    </div>
  );
}
