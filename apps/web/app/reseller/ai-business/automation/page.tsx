"use client";

import { useState, useEffect } from "react";

interface PricingAdjustment {
  locationName: string;
  packageName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: string;
  confidence: number;
}

interface VoucherBatch {
  locationName: string;
  packageName: string;
  count: number;
  durationHours: number;
  expiresAt: string;
  price: number;
}

interface ExpansionROI {
  locationName: string;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyCosts: number;
  estimatedMonthlyProfit: number;
  paybackDays: number;
  recommendedRouter: { name: string; price: number; features: string[] };
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
}

interface LoadBalance {
  locationName: string;
  currentLoad: number;
  maxCapacity: number;
  suggestedAction: string;
  reasoning: string;
}

export default function AIAutomationPage() {
  const [activeTab, setActiveTab] = useState<"pricing" | "vouchers" | "expansion" | "loadbalance">("pricing");
  const [pricing, setPricing] = useState<PricingAdjustment[]>([]);
  const [vouchers, setVouchers] = useState<VoucherBatch[]>([]);
  const [roi, setRoi] = useState<ExpansionROI | null>(null);
  const [loadBalance, setLoadBalance] = useState<LoadBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expansionName, setExpansionName] = useState("");
  const [generating, setGenerating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("netmaster_access_token") : null;

  const apiCall = async (path: string, options?: RequestInit) => {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "API error");
    return data.data;
  };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, v, lb] = await Promise.all([
        apiCall("/business-ai/auto-pricing").catch(() => []),
        apiCall("/business-ai/generate-vouchers", { method: "POST", body: JSON.stringify({ daysAhead: 7 }) }).catch(() => []),
        apiCall("/business-ai/load-balancing").catch(() => []),
      ]);
      setPricing(p || []);
      setVouchers(v || []);
      setLoadBalance(lb || []);
    } catch (err) {
      console.error("Failed to load automation data:", err);
    }
    setLoading(false);
  };

  const calculateROI = async () => {
    if (!expansionName.trim()) return;
    setGenerating(true);
    try {
      const result = await apiCall("/business-ai/expansion-roi", {
        method: "POST",
        body: JSON.stringify({ locationName: expansionName }),
      });
      setRoi(result);
    } catch (err) {
      console.error("Failed to calculate ROI:", err);
    }
    setGenerating(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "add_router": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "promote": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "reduce_price": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "increase_price": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-[var(--text-muted)] bg-[var(--bg-surface)] border-[var(--border-subtle)]";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "add_router": return "🔌 Add Router";
      case "promote": return "📢 Promote";
      case "reduce_price": return "💰 Reduce Price";
      case "increase_price": return "📈 Increase Price";
      default: return "✅ Maintain";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-emerald-400 bg-emerald-500/10";
      case "medium": return "text-amber-400 bg-amber-500/10";
      case "high": return "text-red-400 bg-red-500/10";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⚙️</div>
          <p className="text-[var(--text-muted)]">Loading automation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">⚙️ AI Automation</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Auto-pricing, voucher generation, expansion planning, load balancing</p>
        </div>
        <button onClick={loadAll} className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]">🔄 Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-2 flex-wrap">
        {[
          { key: "pricing", label: "💰 Auto-Pricing" },
          { key: "vouchers", label: "🎫 Voucher Batches" },
          { key: "expansion", label: "🌍 Expansion ROI" },
          { key: "loadbalance", label: "⚖️ Load Balancing" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30" : "text-[var(--text-muted)] border border-transparent"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Auto-Pricing Tab */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          {pricing.length === 0 ? (
            <div className="text-center py-12"><div className="text-5xl mb-4">💰</div><h3 className="text-lg font-semibold text-[var(--text-primary)]">No Pricing Suggestions Yet</h3><p className="text-[var(--text-muted)]">Start selling to get AI-powered pricing recommendations.</p></div>
          ) : (
            <div className="space-y-3">
              {pricing.map((p, i) => (
                <div key={i} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-3">
                    <div><h3 className="font-bold text-[var(--text-primary)]">{p.packageName}</h3><p className="text-xs text-[var(--text-muted)]">{p.locationName}</p></div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{Math.round(p.confidence * 100)}% confidence</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center"><div className="text-xs text-[var(--text-muted)]">Current</div><div className="text-lg font-bold text-[var(--text-primary)]">{p.currentPrice.toLocaleString()} TZS</div></div>
                    <div className="text-2xl text-[var(--text-muted)]">→</div>
                    <div className="text-center"><div className="text-xs text-[var(--text-muted)]">Suggested</div><div className="text-lg font-bold text-emerald-400">{p.suggestedPrice.toLocaleString()} TZS</div></div>
                    <div className="text-center"><div className="text-xs text-[var(--text-muted)]">Change</div><div className={`text-lg font-bold ${p.suggestedPrice > p.currentPrice ? "text-emerald-400" : "text-red-400"}`}>{p.suggestedPrice > p.currentPrice ? "+" : ""}{(p.suggestedPrice - p.currentPrice).toLocaleString()} TZS</div></div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{p.reason}</p>
                  {p.expectedImpact && <p className="text-xs text-[var(--accent-primary)] mt-1">💡 {p.expectedImpact}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voucher Batches Tab */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          {vouchers.length === 0 ? (
            <div className="text-center py-12"><div className="text-5xl mb-4">🎫</div><h3 className="text-lg font-semibold text-[var(--text-primary)]">No Voucher Batches Generated</h3><p className="text-[var(--text-muted)]">Create and activate a business plan to auto-generate vouchers.</p></div>
          ) : (
            <>
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <h3 className="font-bold text-[var(--text-primary)] mb-2">📋 Generated Batches (7 days ahead)</h3>
                <p className="text-sm text-[var(--text-muted)]">{vouchers.length} batches across {new Set(vouchers.map((v) => v.locationName)).size} locations</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vouchers.map((v, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm">{v.packageName}</h4>
                      <span className="text-xs text-[var(--text-muted)]">{v.locationName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><div className="text-xs text-[var(--text-muted)]">Count</div><div className="text-lg font-bold text-[var(--text-primary)]">{v.count}</div></div>
                      <div><div className="text-xs text-[var(--text-muted)]">Price</div><div className="text-lg font-bold text-emerald-400">{v.price.toLocaleString()}</div></div>
                      <div><div className="text-xs text-[var(--text-muted)]">Duration</div><div className="text-lg font-bold text-[var(--text-primary)]">{v.durationHours}h</div></div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">Expires: {new Date(v.expiresAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Expansion ROI Tab */}
      {activeTab === "expansion" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">🌍 Calculate ROI for New Location</h3>
            <div className="flex gap-3">
              <input value={expansionName} onChange={(e) => setExpansionName(e.target.value)} placeholder="Enter location name (e.g., Arusha Center)"
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm" />
              <button onClick={calculateROI} disabled={generating || !expansionName.trim()}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: generating ? "var(--bg-surface)" : "linear-gradient(135deg, #0066FF, #00C2FF)" }}>
                {generating ? "Calculating..." : "Calculate ROI"}
              </button>
            </div>
          </div>

          {roi && (
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-lg">📍 {roi.locationName}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(roi.riskLevel)}`}>{roi.riskLevel} risk</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <div className="text-xs text-emerald-400">Est. Monthly Revenue</div>
                  <div className="text-xl font-bold text-emerald-400">{roi.estimatedMonthlyRevenue.toLocaleString()} TZS</div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                  <div className="text-xs text-red-400">Est. Monthly Costs</div>
                  <div className="text-xl font-bold text-red-400">{roi.estimatedMonthlyCosts.toLocaleString()} TZS</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                  <div className="text-xs text-blue-400">Est. Monthly Profit</div>
                  <div className="text-xl font-bold text-blue-400">{roi.estimatedMonthlyProfit.toLocaleString()} TZS</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]"><div className="text-xs text-[var(--text-muted)]">Payback Period</div><div className="text-lg font-bold text-[var(--text-primary)]">{roi.paybackDays} days</div></div>
                <div className="p-3 rounded-lg bg-[var(--bg-surface)]"><div className="text-xs text-[var(--text-muted)]">Recommended Router</div><div className="text-lg font-bold text-[var(--text-primary)]">{roi.recommendedRouter.name}</div><div className="text-xs text-[var(--text-muted)]">{roi.recommendedRouter.price.toLocaleString()} TZS</div></div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{roi.reasoning}</p>

              {roi.recommendedRouter.features.length > 0 && (
                <div className="mt-3"><div className="text-xs text-[var(--text-muted)] mb-1">Router Features:</div>
                  <div className="flex flex-wrap gap-1">{roi.recommendedRouter.features.map((f, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">{f}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Load Balancing Tab */}
      {activeTab === "loadbalance" && (
        <div className="space-y-4">
          {loadBalance.length === 0 ? (
            <div className="text-center py-12"><div className="text-5xl mb-4">⚖️</div><h3 className="text-lg font-semibold text-[var(--text-primary)]">No Locations to Balance</h3><p className="text-[var(--text-muted)]">Add locations and routers to get load balancing recommendations.</p></div>
          ) : (
            <div className="space-y-3">
              {loadBalance.map((lb, i) => (
                <div key={i} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[var(--text-primary)]">📍 {lb.locationName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(lb.suggestedAction)}`}>{getActionLabel(lb.suggestedAction)}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>Capacity: {lb.currentLoad}%</span>
                      <span>{lb.maxCapacity} max customers</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, lb.currentLoad)}%`,
                        background: lb.currentLoad > 80 ? "linear-gradient(90deg, #FF453A, #FF6B62)" : lb.currentLoad > 50 ? "linear-gradient(90deg, #FF9F0A, #FFC24D)" : "linear-gradient(90deg, #00C853, #00E676)",
                      }} />
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)]">{lb.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
