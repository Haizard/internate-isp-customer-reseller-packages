import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/isps", label: "ISPs", icon: "router" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell items={items} accent="#0A84FF" brand="NetMaster" allowedRoles={["PLATFORM_OWNER"]}>
      {children}
    </AppShell>
  );
}
