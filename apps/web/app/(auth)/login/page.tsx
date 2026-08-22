"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, dashboardPathFor } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nexusnet.co.tz");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      router.push(dashboardPathFor(result.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md mb-4 bg-gradient-to-br from-[#5aa7ff] via-[#0a84ff] to-[#0063d6]">
            <Icon name="router" size={28} />
          </div>
          <h1 className="text-title-1 font-bold text-text-primary">NetMaster</h1>
          <p className="text-callout text-text-secondary mt-1">ISP & Customer Reseller Platform</p>
        </div>

        <div className="glass rounded-xl shadow-sm p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.co.tz"
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-footnote text-accent-red bg-[rgba(255,69,58,0.1)] rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-footnote text-text-secondary mt-5">
          New reseller?{" "}
          <Link href="/register" className="text-accent-blue font-semibold">
            Create your account
          </Link>
        </p>

        <div className="mt-8 glass-subtle rounded-lg p-4">
          <p className="text-caption font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Demo accounts
          </p>
          <ul className="space-y-1 text-footnote text-text-secondary">
            <li>ISP Admin — admin@nexusnet.co.tz</li>
            <li>Reseller — reseller@amina.co.tz</li>
            <li>Customer — john.mushi@customer.co.tz</li>
            <li className="text-caption text-text-tertiary">All passwords: password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
