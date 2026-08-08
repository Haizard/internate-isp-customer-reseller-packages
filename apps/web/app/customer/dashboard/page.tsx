"use client";

import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCents, formatDate, relativeTime } from "@/lib/format";
import { useState } from "react";
import { api } from "@/lib/api";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";

interface Customer {
  id: string;
  name: string;
  status: string;
  wifiSsid: string | null;
  router?: { name: string };
  subscription?: {
    package?: { name: string; speedMbps: number; dataCapGb: number | null; priceCents: number; currency: string };
    startedAt: string;
    renewsAt: string | null;
  } | null;
}

export default function CustomerDashboard() {
  const { data, loading, error, reload } = useApi<Customer>("/customers/me");
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = data!;

  async function redeem() {
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/customers/me/vouchers/redeem", { code });
      setMsg("Voucher redeemed! Your plan has been topped up.");
      setRedeemOpen(false);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Redeem failed");
    } finally {
      setBusy(false);
    }
  }

  const pkg = c.subscription?.package;

  return (
    <div>
      <PageHeader title={`Hi, ${c.name.split(" ")[0]}`} subtitle="Your connection at a glance" />

      <Card className="p-5 mb-4 bg-gradient-to-br from-[rgba(64,200,224,0.2)] to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-footnote text-text-secondary">Current package</p>
            <p className="text-title-1 font-bold text-text-primary">{pkg?.name ?? "No package"}</p>
            <p className="text-callout text-text-secondary mt-1">
              {pkg ? `${pkg.speedMbps} Mbps · ${pkg.dataCapGb ? `${pkg.dataCapGb} GB` : "Unlimited"}` : "Contact your provider"}
            </p>
          </div>
          <StatusBadge status={c.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="glass rounded-lg p-3">
            <p className="text-caption text-text-tertiary">Started</p>
            <p className="text-body font-semibold">{formatDate(c.subscription?.startedAt ?? null)}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-caption text-text-tertiary">Renews</p>
            <p className="text-body font-semibold">{formatDate(c.subscription?.renewsAt ?? null)}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => setRedeemOpen(true)}>
            <Icon name="ticket" size={18} />
            Redeem Voucher
          </Button>
          <Button variant="secondary" onClick={async () => {
            await api.post("/customers/me/requests", { type: "UPGRADE", message: "I would like a faster package" });
            setMsg("Upgrade request submitted — your provider will contact you.");
          }}>
            Request Upgrade
          </Button>
        </div>
        {msg && <p className="mt-3 text-footnote text-accent-green">{msg}</p>}
      </Card>

      <Card className="p-1">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-title-3 font-semibold">WiFi</h2>
        </div>
        <div className="hairline">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-body font-medium">{c.wifiSsid ?? "Your network"}</p>
              <p className="text-footnote text-text-secondary">Connected router: {c.router?.name ?? "—"}</p>
            </div>
            <span className="text-caption text-text-tertiary flex items-center gap-1">
              <Icon name="wifi" size={14} /> last seen {relativeTime(new Date())}
            </span>
          </div>
        </div>
      </Card>

      <Sheet open={redeemOpen} onClose={() => setRedeemOpen(false)} title="Redeem Voucher">
        <div className="space-y-4">
          <Field
            label="Voucher code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
          />
          <Button fullWidth onClick={redeem} disabled={busy || code.length < 4}>
            Redeem
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
