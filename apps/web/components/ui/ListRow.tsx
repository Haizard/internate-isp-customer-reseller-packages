"use client";

import type { ReactNode } from "react";

interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ title, subtitle, leading, trailing, onClick }: ListRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-[background] active:bg-black/[0.03] ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-body font-medium text-text-primary truncate">{title}</div>
        {subtitle && <div className="text-footnote text-text-secondary truncate">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-1">{trailing}</div>}
    </button>
  );
}
