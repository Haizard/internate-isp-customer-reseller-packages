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

interface OrgBranding {
  id: string;
  name: string;
  branding: {
    brandName?: string;
    primaryColor?: string;
    logoUrl?: string | null;
    welcomeMessage?: string;
    footerText?: string;
  } | null;
}

const PRESET_COLORS = [
  "#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#BF5AF2", "#40C8E0",
  "#FF6B62", "#5AA7FF", "#2FB45C", "#D29922", "#A371F7", "#39C5CF",
];

export default function BrandingPage() {
  const { data, loading, error, reload } = useApi<OrgBranding>("/organizations?type=RESELLER");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0A84FF");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [footerText, setFooterText] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const org = data;
  const branding = org?.branding ?? {};

  // Initialize form from data (once)
  if (org && !initialized) {
    setBrandName(branding.brandName ?? org.name);
    setPrimaryColor(branding.primaryColor ?? "#0A84FF");
    setWelcomeMessage(branding.welcomeMessage ?? "");
    setFooterText(branding.footerText ?? "");
    setInitialized(true);
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await api.patch("/organizations/branding", {
        brandName,
        primaryColor,
        welcomeMessage: welcomeMessage || null,
        footerText: footerText || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Branding" subtitle="Customize how your customers see your network" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="edit" size={18} className="text-accent-purple" />
            <h2 className="text-title-3 font-semibold">Brand Settings</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Business name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your business name"
            />
            <Field
              label="Welcome message"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome to our fast internet!"
            />
            <Field
              label="Footer text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Powered by YourBrand"
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="chart" size={18} style={{ color: primaryColor }} />
            <h2 className="text-title-3 font-semibold">Brand Color</h2>
          </div>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  primaryColor === color ? "border-text-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
          <Field
            label="Custom hex color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#0A84FF"
          />
        </Card>
      </div>

      {/* Preview */}
      <Card className="p-5 mt-6">
        <h2 className="text-title-3 font-semibold mb-4">Customer Portal Preview</h2>
        <div
          className="rounded-xl p-6 border border-white/60"
          style={{ background: `linear-gradient(135deg, ${primaryColor}15, transparent)` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)` }}
            >
              <Icon name="router" size={20} />
            </div>
            <div>
              <p className="text-title-3 font-bold" style={{ color: primaryColor }}>{brandName || "Your Brand"}</p>
              <p className="text-footnote text-text-secondary">{welcomeMessage || "Your internet, your way"}</p>
            </div>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-caption text-text-tertiary">Current plan</p>
            <p className="text-body font-semibold">Home Basic · 10 Mbps</p>
          </div>
          <p className="text-caption text-text-tertiary mt-3">{footerText || "Powered by NetMaster"}</p>
        </div>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}
