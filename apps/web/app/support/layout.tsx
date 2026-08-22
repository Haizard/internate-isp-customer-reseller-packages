import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/support/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/support/tickets", label: "Tickets", icon: "ticket" },
  { href: "/settings", label: "Settings", icon: "dashboard" },
];

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      items={items}
      accent="#FF9F0A"
      brand="Support"
      allowedRoles={["PLATFORM_OWNER", "ISP_ADMIN", "SUPPORT_AGENT"]}
    >
      {children}
    </AppShell>
  );
}
