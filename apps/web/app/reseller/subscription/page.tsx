"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCents } from "@/lib/format";

interface Plan {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  maxRouters: number;
  voucherCommissionPct: number;
  features: string[];
}

interface CurrentPlan {
  plan: Plan;
  subscriptionExpires: string | null;
  currentRouters: number;
  canAddMore: boolean;
  voucherCommissionPct: number;
}

export default function SubscriptionPage() {
  const { data: plans, loading: plansLoading, error: plansError } = useApi<Plan[]>("/subscriptions/plans");
  const { data: current, loading: currentLoading, error: currentError, reload } = useApi<CurrentPlan>("/subscriptions/current");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (plansLoading || currentLoading) return <LoadingState />;
  if (plansError || currentError) return <ErrorState message={plansError ?? currentError ?? "Error"} />;

  const allPlans = plans ?? [];
  const currentPlan = current?.plan;
  const isPaid = currentPlan && currentPlan.id !== "free";

  async function upgrade(planId: string) {
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/subscriptions/upgrade", { planId });
      setMsg(`Upgraded to ${planId} plan!`);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm("Are you sure you want to downgrade to the free plan?")) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/subscriptions/cancel");
      setMsg("Downgraded to free plan");
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Manage your plan and billing" />

      {/* Current Plan Status */}
      {current && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title-3 font-semibold">Current Plan: {currentPlan?.name ?? "Free"}</h2>
              {current.subscriptionExpires && (
                <p className="text-footnote text-text-secondary">
                  Expires: {new Date(current.subscriptionExpires).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-caption font-semibold ${isPaid ? "bg-accent-green/15 text-accent-green" : "bg-accent-orange/15 text-accent-orange"}`}>
              {isPaid ? "PAID" : "FREE"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-title-2 font-bold">{current.currentRouters}</p>
              <p className="text-caption text-text-tertiary">Routers Used</p>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-title-2 font-bold">{currentPlan?.maxRouters === -1 ? "∞" : currentPlan?.maxRouters ?? 0}</p>
              <p className="text-caption text-text-tertiary">Router Limit</p>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <p className="text-title-2 font-bold text-accent-purple">{current.voucherCommissionPct}%</p>
              <p className="text-caption text-text-tertiary">Commission</p>
            </div>
          </div>

          {isPaid && (
            <Button variant="destructive" onClick={cancel} disabled={busy}>
              Downgrade to Free
            </Button>
          )}
        </Card>
      )}

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-accent-green/10 text-accent-green text-footnote font-semibold">
          {msg}
        </div>
      )}

      {/* Plan Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {allPlans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const isFree = plan.id === "free";
          const pricePerRouter = !isFree ? Math.round(plan.priceCents / 100) : 0;

          return (
            <Card key={plan.id} className={`p-5 relative ${isCurrent ? "ring-2 ring-accent-blue" : ""}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent-blue text-white text-caption font-semibold">
                  Current Plan
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-title-2 font-bold">{plan.name}</h3>
                <div className="mt-2">
                  {isFree ? (
                    <p className="text-title-1 font-bold text-accent-green">Free</p>
                  ) : (
                    <>
                      <p className="text-title-1 font-bold">{formatCents(pricePerRouter)}</p>
                      <p className="text-caption text-text-tertiary">per router / month</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-footnote text-text-secondary">
                    <Icon name="check" size={14} className="text-accent-green shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <Button fullWidth variant="secondary" disabled>
                  Current Plan
                </Button>
              ) : isFree ? (
                <Button fullWidth variant="ghost" disabled>
                  Free Forever
                </Button>
              ) : (
                <Button fullWidth onClick={() => upgrade(plan.id)} disabled={busy}>
                  {busy ? "Upgrading…" : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
