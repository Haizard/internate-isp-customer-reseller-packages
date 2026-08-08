"use client";

import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <div className="flex-1 min-w-0">
      {label && (
        <label className="block text-footnote font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full h-[44px] px-4 rounded-md bg-white/60 border border-white/60 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:focus-ring ${className}`}
        {...props}
      />
    </div>
  );
}
