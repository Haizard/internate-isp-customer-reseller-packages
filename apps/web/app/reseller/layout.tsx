import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/reseller/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/reseller/earnings", label: "Earnings", icon: "credit" },
  { href: "/reseller/customers", label: "Customers", icon: "users" },
  { href: "/reseller/vouchers", label: "Vouchers", icon: "ticket" },
  { href: "/reseller/locations", label: "Locations", icon: "location" },
  { href: "/reseller/routers", label: "Routers", icon: "router" },
  { href: "/reseller/subscription", label: "Subscription", icon: "credit" },
  { href: "/reseller/ai-business", label: "AI Business Partner", icon: "ai" },
  { href: "/reseller/branding", label: "Branding", icon: "edit" },
  { href: "/settings", label: "Settings", icon: "dashboard" },
];

export default function ResellerLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell items={items} accent="#BF5AF2" brand="NetMaster" allowedRoles={["RESELLER"]}>
      {children}
    </AppShell>
  );
}
