import type { Metadata } from "next";
import { HotspotLoader } from "@/components/hotspot/HotspotLoader";

export const metadata: Metadata = {
  title: "NetMaster Hotspot — WiFi Voucher Redemption",
  description: "WiFi plans and voucher redemption for NetMaster hotspots.",
};

export default function HotspotPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto">
        <HotspotLoader />
        <p className="text-center text-footnote text-text-tertiary mt-6">Powered by NetMaster</p>
      </div>
    </main>
  );
}
