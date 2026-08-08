"use client";

import { Icon } from "../ui/Icon";
import { logout } from "@/lib/auth";

export function MobileTabBar({ items, accent }: { items: { href: string; label: string; icon: string }[]; accent: string }) {
  const items_ = items.slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-strong border-t border-white/60">
      <div className="grid grid-cols-5 h-[68px] pb-[env(safe-area-inset-bottom)]">
        {items_.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 text-caption text-text-secondary"
          >
            <Icon name={item.icon} size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function MobileTopBar({ brand, accent, userName }: { brand: string; accent: string; userName: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-20 glass-strong px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: accent }}>
          <Icon name="router" size={15} />
        </div>
        <span className="text-title-2 font-bold">{brand}</span>
      </div>
      <button onClick={logout} className="text-text-tertiary" aria-label="Log out">
        <Icon name="logOut" size={20} />
      </button>
    </header>
  );
}
