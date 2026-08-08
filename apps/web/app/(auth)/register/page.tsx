"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role: "RESELLER",
        orgName: orgName || `${name}'s Reseller`,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-purple flex items-center justify-center text-white shadow-md mb-4">
            <Icon name="users" size={28} />
          </div>
          <h1 className="text-title-1 font-bold text-text-primary">Become a Reseller</h1>
          <p className="text-callout text-text-secondary mt-1">Apply to resell internet access</p>
        </div>

        <div className="glass rounded-xl shadow-sm p-5">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(48,209,88,0.15)] text-[#30D158] flex items-center justify-center mb-3">
                <Icon name="check" size={24} />
              </div>
              <p className="text-body font-semibold text-text-primary">Application submitted</p>
              <p className="text-footnote text-text-secondary mt-1">
                The ISP admin will review and approve your reseller account.
              </p>
              <Link href="/login" className="inline-block mt-4 text-accent-blue font-semibold text-footnote">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amina Hassan" />
              <Field
                label="Business name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Amina Home Reseller"
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {error && (
                <p className="text-footnote text-accent-red bg-[rgba(255,69,58,0.1)] rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <Button type="submit" fullWidth size="lg" variant="secondary" disabled={loading}>
                {loading ? "Submitting…" : "Apply to become a reseller"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-footnote text-text-secondary mt-5">
          Already registered?{" "}
          <Link href="/login" className="text-accent-blue font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
