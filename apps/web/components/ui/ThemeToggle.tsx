"use client";

import { useTheme } from "@/lib/theme";
import { Icon } from "./Icon";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 rounded-full bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 flex items-center justify-center transition-all active:scale-95 hover:bg-white/90 dark:hover:bg-white/15 ${className ?? ""}`}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <Icon
        name={resolvedTheme === "dark" ? "sun" : "moon"}
        size={16}
        className="text-text-secondary"
      />
    </button>
  );
}
