"use client";

import type { ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full md:max-w-md glass-strong rounded-t-xl md:rounded-xl shadow-lg spring transition-transform max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center pt-2 md:hidden">
          <div className="w-9 h-1 rounded-pill bg-black/20" />
        </div>
        {title && (
          <div className="px-5 pt-3 pb-2">
            <h3 className="text-title-2 font-semibold">{title}</h3>
          </div>
        )}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
