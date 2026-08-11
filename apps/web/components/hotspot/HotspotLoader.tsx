"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { HotspotPortal, type HotspotData } from "@/components/hotspot/HotspotPortal";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/States";

export function HotspotLoader() {
  const [hotspot, setHotspot] = useState<HotspotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("hotspot");

    if (!param) {
      const timer = setTimeout(() => {
        setError("No hotspot specified");
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    api
      .get<HotspotData>(`/hotspot/${encodeURIComponent(param)}`)
      .then((data) => {
        if (!cancelled) setHotspot(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Hotspot not available");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Loading hotspot…" />;
  }

  if (error || !hotspot) {
    return (
      <div className="glass-strong rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Icon name="alert" size={30} className="text-accent-red" />
        <h1 className="text-title-2 font-semibold">Hotspot not available</h1>
        <p className="text-footnote text-text-secondary">
          {error ?? "This WiFi hotspot could not be found. Check the QR code and try again."}
        </p>
      </div>
    );
  }

  return <HotspotPortal hotspot={hotspot} />;
}
