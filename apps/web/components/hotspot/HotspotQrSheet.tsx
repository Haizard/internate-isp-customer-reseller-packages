"use client";

import QRCode from "react-qr-code";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";

interface HotspotQrSheetProps {
  open: boolean;
  onClose: () => void;
  routerName: string;
  locationName: string;
  locationId: string;
}

export function HotspotQrSheet({ open, onClose, routerName, locationName, locationId }: HotspotQrSheetProps) {
  const href = `${window.location.origin}/hotspot?hotspot=${locationId}`;

  return (
    <Sheet open={open} onClose={onClose} title="WiFi Hotspot QR">
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-white/60">
          <div className="w-10 h-10 rounded-full bg-[rgba(191,90,242,0.15)] text-accent-purple flex items-center justify-center shrink-0">
            <Icon name="wifi" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-text-primary truncate">{routerName}</div>
            <div className="text-footnote text-text-secondary truncate">{locationName}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-md border border-white/60">
          <QRCode value={href} size={200} fgColor="#1c1c1e" bgColor="#ffffff" />
        </div>
        <p className="text-footnote text-text-secondary text-center">
          Customers scan this QR to see your plans and redeem a voucher code.
        </p>
        <div className="w-full rounded-xl bg-white/70 border border-white/60 px-3 py-2 text-footnote text-text-secondary break-all">
          {href}
        </div>
      </div>
    </Sheet>
  );
}
