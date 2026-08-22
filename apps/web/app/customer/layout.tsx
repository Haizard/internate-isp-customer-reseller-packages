import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

const items = [
  { href: "/customer/dashboard", label: "My Connection", icon: "dashboard" },
  { href: "/customer/wifi", label: "WiFi", icon: "wifi" },
  { href: "/customer/devices", label: "Devices", icon: "eye" },
  { href: "/customer/usage", label: "Usage", icon: "chart" },
  { href: "/customer/billing", label: "Billing", icon: "credit" },
  { href: "/settings", label: "Settings", icon: "dashboard" },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      items={items}
      accent="#40C8E0"
      brand="My Net"
      allowedRoles={["CUSTOMER"]}
      headerActions={<NotificationsBell />}
    >
      {children}
    </AppShell>
  );
}
