"use client";

import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";
import { logout } from "@/lib/auth";

export function MobileTabBar({ items, accent }: { items: { href: string; label: string; icon: string }[]; accent: string }) {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-strong border-t border-white/60">
      <div className="flex h-[68px] pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-caption"
            >
              <span
                className="flex items-center justify-center w-11 h-7 rounded-pill transition-all duration-[280ms]"
                style={active ? { backgroundColor: `${accent}26`, color: accent } : undefined}
              >
                <Icon name={item.icon} size={20} className={active ? undefined : "text-text-secondary"} />
              </span>
              <span
                className={`text-[10px] font-semibold truncate max-w-full px-1 ${active ? "" : "text-text-secondary"}`}
                style={active ? { color: accent } : undefined}
              >
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileTopBar({ brand, accent, userName }: { brand: string; accent: string; userName: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-20 glass-strong px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}
        >
          <Icon name="router" size={15} />
        </div>
        <span className="text-title-2 font-bold">{brand}</span>
      </div>
      <button onClick={logout} className="text-text-tertiary hover:text-accent-red transition-colors" aria-label="Log out">
        <Icon name="logOut" size={20} />
      </button>
    </header>
  );
}
