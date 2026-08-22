"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  { id: "location", title: "Create a Location", subtitle: "Where do you serve customers?" },
  { id: "router", title: "Add a Router", subtitle: "Register your gateway device" },
  { id: "package", title: "Create a Package", subtitle: "Define an internet plan to sell" },
  { id: "customer", title: "Add First Customer", subtitle: "Onboard your first customer" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step data
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const [routerName, setRouterName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [createdLocationId, setCreatedLocationId] = useState<string | null>(null);
  const [createdRouterId, setCreatedRouterId] = useState<string | null>(null);

  const [packageName, setPackageName] = useState("Home Basic");
  const [speedMbps, setSpeedMbps] = useState(10);
  const [dataCapGb, setDataCapGb] = useState(0);
  const [priceCents, setPriceCents] = useState(25000);
  const [createdPackageId, setCreatedPackageId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerWifiSsid, setCustomerWifiSsid] = useState("");

  const current = STEPS[step];

  async function saveLocation() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ id: string }>("/locations", {
        name: locationName,
        address: locationAddress || null,
      });
      setCreatedLocationId(result.id);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRouter() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ id: string }>("/routers", {
        name: routerName,
        macAddress,
        locationId: createdLocationId,
      });
      setCreatedRouterId(result.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function savePackage() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ id: string }>("/packages", {
        name: packageName,
        speedMbps,
        dataCapGb: dataCapGb > 0 ? dataCapGb : null,
        priceCents,
      });
      setCreatedPackageId(result.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveCustomer() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/customers", {
        name: customerName,
        phone: customerPhone,
        wifiSsid: customerWifiSsid || `${customerName.replace(/\s+/g, "")}_WiFi`,
        routerId: createdRouterId,
        packageId: createdPackageId,
      });
      // Onboarding complete!
      router.push("/reseller/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function skipToEnd() {
    router.push("/reseller/dashboard");
  }

  return (
    <div>
      <PageHeader title="Getting Started" subtitle="Set up your reseller business in 4 steps" />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-accent-purple" : "bg-black/5"
                }`}
              />
              <p className={`text-caption mt-1 ${i === step ? "text-accent-purple font-semibold" : "text-text-tertiary"}`}>
                {i + 1}. {i < step ? "Done" : s.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent-purple/15 text-accent-purple flex items-center justify-center">
            <Icon name={step === 0 ? "location" : step === 1 ? "router" : step === 2 ? "box" : "users"} size={20} />
          </div>
          <div>
            <h2 className="text-title-3 font-semibold">{current.title}</h2>
            <p className="text-footnote text-text-secondary">{current.subtitle}</p>
          </div>
        </div>

        {error && (
          <p className="text-footnote text-accent-red bg-[rgba(255,69,58,0.1)] rounded-md px-3 py-2 mb-4">{error}</p>
        )}

        {/* Step 1: Location */}
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Location name" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Mbezi Shop, Home Block A" />
            <Field label="Address (optional)" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Street, Area, City" />
            <div className="flex gap-3">
              <Button fullWidth onClick={saveLocation} disabled={busy || !locationName}>
                {busy ? "Saving…" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Router */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Router name" value={routerName} onChange={(e) => setRouterName(e.target.value)} placeholder="e.g. Gateway Main" />
            <Field label="MAC Address" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="A4:2B:B0:00:00:01" />
            <div className="flex gap-3">
              <Button fullWidth onClick={saveRouter} disabled={busy || !routerName || !macAddress}>
                {busy ? "Saving…" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Package */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Package name" value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Home Basic" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Speed (Mbps)" type="number" value={speedMbps} onChange={(e) => setSpeedMbps(Number(e.target.value))} />
              <Field label="Data cap (GB, 0=unlimited)" type="number" value={dataCapGb} onChange={(e) => setDataCapGb(Number(e.target.value))} />
            </div>
            <Field label="Monthly price (TZS)" type="number" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} />
            <div className="flex gap-3">
              <Button fullWidth onClick={savePackage} disabled={busy || !packageName}>
                {busy ? "Saving…" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: First Customer */}
        {step === 3 && (
          <div className="space-y-4">
            <Field label="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Mushi" />
            <Field label="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="255712000000" />
            <Field label="WiFi name (optional)" value={customerWifiSsid} onChange={(e) => setCustomerWifiSsid(e.target.value)} placeholder="Auto-generated if empty" />
            <div className="flex gap-3">
              <Button fullWidth onClick={saveCustomer} disabled={busy || !customerName || !customerPhone}>
                {busy ? "Saving…" : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 text-center">
        <button onClick={skipToEnd} className="text-footnote text-text-tertiary hover:text-text-secondary transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  );
}
