"use client";

import { Icon } from "../ui/Icon";
import { NavLink, type NavItem } from "./NavLink";
import { logout } from "@/lib/auth";

interface SidebarProps {
  brand: string;
  items: NavItem[];
  accent: string;
  userName: string;
  userRole: string;
  headerActions?: React.ReactNode;
}

export function Sidebar({ brand, items, accent, userName, userRole, headerActions }: SidebarProps) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] glass flex-col z-30">
      <div className="px-6 h-16 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}
        >
          <Icon name="router" size={18} />
        </div>
        <span className="text-title-2 font-bold text-text-primary flex-1 truncate">{brand}</span>
        {headerActions}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {items.map((item) => (
          <NavLink key={item.href} item={item} accent={accent} />
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-black/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-footnote font-bold shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}
          >
            {userName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-footnote font-semibold text-text-primary truncate">{userName}</p>
            <p className="text-caption text-text-tertiary">{userRole.toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            className="text-text-tertiary hover:text-accent-red transition-colors"
            aria-label="Log out"
          >
            <Icon name="logOut" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
