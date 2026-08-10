"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function NavLink({ item, accent }: { item: NavItem; accent: string }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      style={active ? { color: accent } : undefined}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-md text-footnote font-semibold transition-all duration-[180ms] ${
        active
          ? "bg-white/70 shadow-sm ring-1 ring-inset ring-accent-blue/10"
          : "text-text-secondary hover:bg-white/50 hover:text-text-primary"
      }`}
    >
      <Icon name={item.icon} size={20} />
      <span className="truncate">{item.label}</span>
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-pill"
          style={{ backgroundColor: accent, boxShadow: `0 2px 8px ${accent}55` }}
        />
      )}
    </Link>
  );
}
