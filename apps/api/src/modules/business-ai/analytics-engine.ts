/**
 * Analytics Engine for AI Business Partner
 * Analyzes sales data, predicts demand, and generates insights.
 */

export interface SalesData {
  date: string;
  locationId?: string;
  locationName?: string;
  voucherCount: number;
  revenue: number;
  customers: number;
  peakHour?: number;
}

export interface DemandPrediction {
  locationName: string;
  predictedDailySales: number;
  predictedRevenue: number;
  confidence: number; // 0-1
  peakHours: number[];
  recommendedPrice: number;
  trend: "growing" | "stable" | "declining";
}

export interface BusinessInsight {
  type: "warning" | "opportunity" | "achievement" | "suggestion";
  title: string;
  message: string;
  action?: string;
  priority: "high" | "medium" | "low";
}

export interface ProgressReport {
  planName: string;
  daysActive: number;
  totalDaysInMonth: number;
  actualRevenue: number;
  targetRevenue: number;
  progressPercent: number;
  onTrack: boolean;
  dailyAverage: number;
  requiredDaily: number;
  projectedMonthEnd: number;
  locationBreakdown: Array<{
    name: string;
    actual: number;
    target: number;
    percent: number;
  }>;
}

export class AnalyticsEngine {
  /**
   * Analyze sales data and generate demand predictions
   */
  analyzeDemand(salesHistory: SalesData[], locations: Array<{ name: string; routers: number; customers: number }>): DemandPrediction[] {
    // Group sales by location
    const byLocation = new Map<string, SalesData[]>();
    for (const sale of salesHistory) {
      const key = sale.locationName || sale.locationId || "unknown";
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key)!.push(sale);
    }

    const predictions: DemandPrediction[] = [];

    for (const loc of locations) {
      const locSales = byLocation.get(loc.name) || [];
      
      if (locSales.length === 0) {
        // No data — use defaults based on customer count
        predictions.push({
          locationName: loc.name,
          predictedDailySales: Math.ceil(loc.customers * 0.3), // 30% daily active
          predictedRevenue: Math.ceil(loc.customers * 0.3 * 1500),
          confidence: 0.3,
          peakHours: [12, 18, 19],
          recommendedPrice: 1500,
          trend: "stable",
        });
        continue;
      }

      // Calculate metrics
      const totalSales = locSales.reduce((sum, s) => sum + s.voucherCount, 0);
      const totalRevenue = locSales.reduce((sum, s) => sum + s.revenue, 0);
      const avgDailySales = totalSales / Math.max(locSales.length, 1);
      const avgDailyRevenue = totalRevenue / Math.max(locSales.length, 1);

      // Detect trend (compare last 7 days vs previous 7 days)
      const sorted = [...locSales].sort((a, b) => a.date.localeCompare(b.date));
      const recent = sorted.slice(-7);
      const previous = sorted.slice(-14, -7);
      const recentAvg = recent.reduce((s, d) => s + d.voucherCount, 0) / Math.max(recent.length, 1);
      const prevAvg = previous.reduce((s, d) => s + d.voucherCount, 0) / Math.max(previous.length, 1);
      
      let trend: "growing" | "stable" | "declining" = "stable";
      if (recentAvg > prevAvg * 1.15) trend = "growing";
      else if (recentAvg < prevAvg * 0.85) trend = "declining";

      // Find peak hours
      const hourCounts = new Map<number, number>();
      for (const s of locSales) {
        if (s.peakHour !== undefined) {
          hourCounts.set(s.peakHour, (hourCounts.get(s.peakHour) || 0) + 1);
        }
      }
      const peakHours = [...hourCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([h]) => h);
      if (peakHours.length === 0) peakHours.push(12, 18, 19);

      // Calculate confidence based on data amount
      const confidence = Math.min(0.9, 0.3 + (locSales.length / 30) * 0.6);

      // Dynamic pricing suggestion
      const avgPricePerSale = avgDailySales > 0 ? avgDailyRevenue / avgDailySales : 1500;
      let recommendedPrice = Math.round(avgPricePerSale);
      if (trend === "growing") recommendedPrice = Math.round(avgPricePerSale * 1.1);
      if (trend === "declining") recommendedPrice = Math.round(avgPricePerSale * 0.9);

      predictions.push({
        locationName: loc.name,
        predictedDailySales: Math.round(avgDailySales),
        predictedRevenue: Math.round(avgDailyRevenue),
        confidence,
        peakHours,
        recommendedPrice,
        trend,
      });
    }

    return predictions;
  }

  /**
   * Generate business insights based on sales data and plan
   */
  generateInsights(
    salesHistory: SalesData[],
    plan: { monthlyProfitTarget: number; monthlyRevenueTarget: number; totalCosts: number; locationPlans: any[] },
    subscriptionPlan: string,
    totalRouters: number
  ): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Calculate current month revenue
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthSales = salesHistory.filter((s) => s.date >= monthStart);
    const currentRevenue = monthSales.reduce((sum, s) => sum + s.revenue, 0);

    // Progress check
    const expectedProgress = dayOfMonth / daysInMonth;
    const actualProgress = plan.monthlyRevenueTarget > 0 ? currentRevenue / plan.monthlyRevenueTarget : 0;

    if (actualProgress < expectedProgress * 0.7) {
      insights.push({
        type: "warning",
        title: "⚠️ Behind Target",
        message: `You're at ${Math.round(actualProgress * 100)}% of your revenue target but ${Math.round(expectedProgress * 100)}% through the month. You need ${(plan.monthlyRevenueTarget - currentRevenue).toLocaleString()} TZS in the remaining ${daysInMonth - dayOfMonth} days.`,
        action: "Consider increasing marketing or adjusting prices",
        priority: "high",
      });
    } else if (actualProgress >= expectedProgress * 1.1) {
      insights.push({
        type: "achievement",
        title: "🎉 Ahead of Target!",
        message: `Great work! You're at ${Math.round(actualProgress * 100)}% of your target with ${daysInMonth - dayOfMonth} days remaining. You're on track to exceed your profit goal.`,
        priority: "low",
      });
    }

    // Subscription upgrade suggestion
    const monthlyCosts = plan.totalCosts;
    const monthlyProfit = currentRevenue - monthlyCosts;
    
    if (subscriptionPlan === "Starter" && totalRouters > 2) {
      insights.push({
        type: "suggestion",
        title: "💡 Upgrade to Growth Plan",
        message: `You have ${totalRouters} routers but you're on the free plan (max 2 routers, 5% commission). Upgrading to Growth (8,000 TZS/router) would remove the commission and give you unlimited routers.`,
        action: "Upgrade to Growth plan to save on commission",
        priority: "high",
      });
    }

    if (subscriptionPlan === "Growth" && monthlyProfit > 200000) {
      insights.push({
        type: "suggestion",
        title: "💡 Consider Enterprise Plan",
        message: `Your monthly profit is ${(monthlyProfit).toLocaleString()} TZS. Enterprise plan (25,000 TZS/router) includes API access, custom SLA, and dedicated support — worth it at your scale.`,
        action: "Upgrade to Enterprise for advanced features",
        priority: "medium",
      });
    }

    // Demand-based insights
    const predictions = this.analyzeDemand(salesHistory, plan.locationPlans.map((lp: any) => ({
      name: lp.name,
      routers: lp.routers || 1,
      customers: lp.currentCustomers || 10,
    })));

    for (const pred of predictions) {
      if (pred.trend === "declining") {
        insights.push({
          type: "warning",
          title: `📉 Declining Sales at ${pred.locationName}`,
          message: `Sales at ${pred.locationName} have been declining. Consider lowering prices by ~${Math.round((1 - pred.recommendedPrice / 1500) * 100)}% or running a promotion.`,
          priority: "medium",
        });
      }

      if (pred.confidence > 0.6 && pred.predictedRevenue > 0) {
        insights.push({
          type: "suggestion",
          title: `📊 ${pred.locationName} Demand Pattern`,
          message: `Peak hours are at ${pred.peakHours.map((h) => `${h}:00`).join(", ")}. Consider time-based pricing: higher during peak, lower off-peak.`,
          priority: "low",
        });
      }
    }

    // Expansion suggestion
    const totalActualRevenue = predictions.reduce((sum, p) => sum + p.predictedRevenue * 30, 0);
    if (totalActualRevenue > plan.monthlyRevenueTarget * 1.3 && predictions.length < 5) {
      insights.push({
        type: "opportunity",
        title: "🌍 Expansion Opportunity",
        message: `Your current locations are generating ${Math.round((totalActualRevenue / plan.monthlyRevenueTarget) * 100)}% of target. You have capacity to expand to a new location.`,
        action: "Let me help you plan a new location",
        priority: "medium",
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate progress report against active plan
   */
  generateProgressReport(
    plan: { name: string; monthlyRevenueTarget: number; locationPlans: any[]; activatedAt: string | Date | null },
    salesHistory: SalesData[]
  ): ProgressReport {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Calculate days active
    const activatedAt = plan.activatedAt ? new Date(plan.activatedAt) : new Date(now.getFullYear(), now.getMonth(), 1);
    const daysActive = Math.max(1, Math.ceil((now.getTime() - activatedAt.getTime()) / (1000 * 60 * 60 * 24)));

    // Current month sales
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthSales = salesHistory.filter((s) => s.date >= monthStart);
    const actualRevenue = monthSales.reduce((sum, s) => sum + s.revenue, 0);
    
    const dailyAverage = daysActive > 0 ? actualRevenue / daysActive : 0;
    const requiredDaily = (plan.monthlyRevenueTarget - actualRevenue) / Math.max(1, daysInMonth - dayOfMonth);
    const projectedMonthEnd = actualRevenue + dailyAverage * (daysInMonth - dayOfMonth);

    // Location breakdown
    const locationBreakdown = plan.locationPlans.map((lp: any) => {
      const locSales = monthSales.filter((s) => s.locationName === lp.name);
      const actual = locSales.reduce((sum, s) => sum + s.revenue, 0);
      const target = lp.monthlyRevenueTarget || 0;
      return {
        name: lp.name,
        actual,
        target,
        percent: target > 0 ? Math.round((actual / target) * 100) : 0,
      };
    });

    return {
      planName: plan.name,
      daysActive,
      totalDaysInMonth: daysInMonth,
      actualRevenue,
      targetRevenue: plan.monthlyRevenueTarget,
      progressPercent: plan.monthlyRevenueTarget > 0 ? Math.round((actualRevenue / plan.monthlyRevenueTarget) * 100) : 0,
      onTrack: projectedMonthEnd >= plan.monthlyRevenueTarget * 0.9,
      dailyAverage: Math.round(dailyAverage),
      requiredDaily: Math.round(requiredDaily),
      projectedMonthEnd: Math.round(projectedMonthEnd),
      locationBreakdown,
    };
  }
}
