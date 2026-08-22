export interface SubscriptionPlan {
  id: string;
  name: string;
  priceCents: number; // monthly price in cents (0 = free)
  currency: string;
  maxRouters: number; // -1 = unlimited
  voucherCommissionPct: number; // percentage taken from each voucher sale
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Starter",
    priceCents: 0,
    currency: "TZS",
    maxRouters: 2,
    voucherCommissionPct: 5,
    features: [
      "Up to 2 routers",
      "Basic dashboard",
      "5% voucher commission",
      "Customer management",
      "Basic voucher generation",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceCents: 8000_00, // 8,000 TZS per router/month (billed per router)
    currency: "TZS",
    maxRouters: -1, // unlimited
    voucherCommissionPct: 0,
    features: [
      "Unlimited routers",
      "0% voucher commission (keep 100%)",
      "Multi-location management",
      "White-label branding",
      "Advanced analytics",
      "Priority support",
      "Earnings dashboard",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceCents: 25000_00, // 25,000 TZS per router/month
    currency: "TZS",
    maxRouters: -1,
    voucherCommissionPct: 0,
    features: [
      "Everything in Growth",
      "API access",
      "Custom SLA",
      "Dedicated support",
      "Custom branding",
      "Bulk operations",
      "Audit logs",
    ],
  },
};

export function getPlan(planId: string): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId] ?? SUBSCRIPTION_PLANS.free;
}

export function canAddRouter(currentRouterCount: number, planId: string): boolean {
  const plan = getPlan(planId);
  if (plan.maxRouters === -1) return true;
  return currentRouterCount < plan.maxRouters;
}

export function calculateCommission(voucherValueCents: number, planId: string): number {
  const plan = getPlan(planId);
  return Math.round(voucherValueCents * plan.voucherCommissionPct / 100);
}
