"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ NAVBAR ═══ */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--grad-blue)] flex items-center justify-center text-white shadow-md shadow-[var(--accent-blue)]/20 group-hover:shadow-lg group-hover:shadow-[var(--accent-blue)]/30 transition-shadow">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h.01M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h.01M20 12h.01M6.34 17.66l-2.83 2.83M19.07 4.93l-2.83 2.83" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Net<span className="text-gradient">Master</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Home
            </Link>
            <Link href="/blog" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Blog
            </Link>
            <Link href="/shop" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Shop
            </Link>
            <div className="w-px h-5 bg-[var(--hairline)] mx-2" />
            <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Sign In
            </Link>
            <Link href="/register" className="ml-1 px-5 py-2 rounded-xl bg-[var(--grad-blue)] text-white text-sm font-bold shadow-md shadow-[var(--accent-blue)]/15 hover:shadow-lg hover:shadow-[var(--accent-blue)]/25 transition-all">
              Get Started
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--glass-surface)] transition-all"
          >
            <div className="space-y-1.5">
              <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden glass-strong border-t border-[var(--hairline)] px-4 py-4 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Home
            </Link>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Blog
            </Link>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Shop
            </Link>
            <div className="h-px bg-[var(--hairline)] my-2" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all">
              Sign In
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl bg-[var(--grad-blue)] text-white text-sm font-bold text-center shadow-md">
              Get Started Free
            </Link>
          </div>
        )}
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 bg-networking bg-networking-nodes">{children}</main>

      {/* ═══ FOOTER ═══ */}
      <footer className="glass-strong border-t border-[var(--hairline)] mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--grad-blue)] flex items-center justify-center text-white shadow-sm">
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h.01M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h.01M20 12h.01M6.34 17.66l-2.83 2.83M19.07 4.93l-2.83 2.83" />
                  </svg>
                </div>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">NetMaster</span>
              </Link>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Cloud-managed ISP & reseller platform for East Africa.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/shop", label: "Router Store" },
                  { href: "/#pricing", label: "Pricing" },
                  { href: "/blog", label: "Blog" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/blog", label: "Tutorials" },
                  { href: "/blog", label: "Getting Started" },
                  { href: "/blog", label: "Firmware Guides" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Account</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/login", label: "Sign In" },
                  { href: "/register", label: "Register" },
                  { href: "/login", label: "Reseller Dashboard" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-6 border-t border-[var(--hairline)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">
              © {new Date().getFullYear()} NetMaster. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-tertiary)]">Made in Tanzania 🇹🇿</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
