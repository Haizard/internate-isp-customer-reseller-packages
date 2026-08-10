"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold select-none transition-[transform,opacity] duration-[180ms] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  const heights = size === "lg" ? "h-[50px] text-[17px]" : "h-[44px] text-[15px]";
  const widths = fullWidth ? "w-full" : "px-5";

  const variants = {
    primary:
      "text-white shadow-md bg-gradient-to-br from-[#5aa7ff] via-accent-blue to-[#0063d6] hover:brightness-105",
    secondary: "bg-white/70 text-accent-blue border border-white/60 backdrop-blur",
    destructive:
      "text-white shadow-md bg-gradient-to-br from-[#ff6b62] via-accent-red to-[#dd2f26] hover:brightness-105",
    ghost: "bg-transparent text-accent-blue",
  };

  return (
    <button className={`${base} ${heights} ${widths} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
