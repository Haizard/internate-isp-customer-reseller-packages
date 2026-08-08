import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/reseller/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/reseller/locations", label: "Locations", icon: "location" },
  { href: "/reseller/routers", label: "Routers", icon: "router" },
  { href: "/reseller/customers", label: "Customers", icon: "users" },
  { href: "/reseller/vouchers", label: "Vouchers", icon: "ticket" },
];

export default function ResellerLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell items={items} accent="#BF5AF2" brand="NetMaster" allowedRoles={["RESELLER"]}>
      {children}
    </AppShell>
  );
}
