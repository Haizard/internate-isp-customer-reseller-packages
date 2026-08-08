import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/resellers", label: "Resellers", icon: "users" },
  { href: "/packages", label: "Packages", icon: "box" },
  { href: "/reports", label: "Reports", icon: "chart" },
];

export default function IsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell items={items} accent="#0A84FF" brand="NetMaster" allowedRoles={["PLATFORM_OWNER", "ISP_ADMIN"]}>
      {children}
    </AppShell>
  );
}
