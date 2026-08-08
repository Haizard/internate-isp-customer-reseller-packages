"use client";

import type { ReactNode } from "react";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="glass rounded-pill p-1 flex gap-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 h-9 px-4 rounded-pill text-footnote font-semibold transition-all duration-[280ms] ${
              active ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
      className={`w-[51px] h-[31px] rounded-pill relative transition-colors duration-[280ms] ${
        checked ? "bg-accent-green" : "bg-black/15"
      }`}
    >
      <span
        className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-[left] duration-[280ms] ${
          checked ? "left-[22px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
