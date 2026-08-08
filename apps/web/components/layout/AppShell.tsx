"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTabBar, MobileTopBar } from "./MobileNav";
import { getStoredUser, dashboardPathFor } from "@/lib/auth";
import type { NavItem } from "./NavLink";

interface AppShellProps {
  items: NavItem[];
  accent: string;
  brand?: string;
  allowedRoles: string[];
  children: ReactNode;
}

export function AppShell({ items, accent, brand = "NetMaster", allowedRoles, children }: AppShellProps) {
  const router = useRouter();
  const user = getStoredUser();

  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace(user ? dashboardPathFor(user.role) : "/login");
    }
  }, [user, allowedRoles, router]);

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  const roleLabel = user.role.toLowerCase().replace("_", " ");

  return (
    <div className="min-h-screen">
      <Sidebar brand={brand} items={items} accent={accent} userName={user.name} userRole={roleLabel} />
      <MobileTopBar brand={brand} accent={accent} userName={user.name} />
      <main className="lg:ml-[260px] px-4 md:px-8 py-6 md:py-8 pb-24 lg:pb-8 max-w-6xl">
        {children}
      </main>
      <MobileTabBar items={items} accent={accent} />
    </div>
  );
}
