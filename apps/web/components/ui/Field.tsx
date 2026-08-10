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
        className={`w-full h-[44px] px-4 rounded-md bg-white/70 border border-[rgba(10,132,255,0.2)] text-body text-text-primary placeholder:text-text-tertiary outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/15 hover:border-[rgba(10,132,255,0.35)] ${className}`}
        {...props}
      />
    </div>
  );
}
