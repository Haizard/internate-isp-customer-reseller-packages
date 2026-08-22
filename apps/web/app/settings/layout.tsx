import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/settings", label: "Settings", icon: "dashboard" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      items={items}
      accent="#0A84FF"
      brand="NetMaster"
      allowedRoles={["PLATFORM_OWNER", "ISP_ADMIN", "RESELLER", "CUSTOMER", "SUPPORT_AGENT"]}
    >
      {children}
    </AppShell>
  );
}
