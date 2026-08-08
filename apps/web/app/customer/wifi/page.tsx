"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";

interface Customer {
  wifiSsid: string | null;
  wifiPassword: string | null;
}

export default function WifiPage() {
  const { data, loading, error, reload } = useApi<Customer>("/customers/me");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const currentSsid = ssid || data?.wifiSsid || "";

  async function save() {
    setBusy(true);
    try {
      await api.patch("/customers/me/wifi", { wifiSsid: ssid || data?.wifiSsid || "MyNet", wifiPassword: password });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="WiFi Settings" subtitle="Change your network name and password" />

      <Card className="p-5 max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="wifi" size={20} className="text-accent-teal" />
          <h2 className="text-title-3 font-semibold">Your network</h2>
        </div>
        <div className="space-y-4">
          <Field
            label="Network name (SSID)"
            value={currentSsid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="MyNet_WiFi"
          />
          <Field
            label="New WiFi password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button fullWidth onClick={save} disabled={busy}>
            {saved ? "Saved ✓" : "Save Changes"}
          </Button>
          <p className="text-caption text-text-tertiary">
            MVP note: changes are stored and a simulated push to the router is recorded.
          </p>
        </div>
      </Card>
    </div>
  );
}
