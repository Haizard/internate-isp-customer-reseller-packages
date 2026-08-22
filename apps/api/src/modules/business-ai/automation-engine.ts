/**
 * Automation Engine for AI Business Partner Phase 3
 * Auto-adjust pricing, generate vouchers, ROI calculation, load balancing.
 */

import type { SalesData, DemandPrediction } from "./analytics-engine";

export interface PricingAdjustment {
  locationName: string;
  packageName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: string;
  confidence: number;
}

export interface VoucherBatch {
  locationId?: string;
  locationName: string;
  packageName: string;
  count: number;
  durationHours: number;
  expiresAt: Date;
  price: number;
}

export interface ExpansionROI {
  locationName: string;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyCosts: number;
  estimatedMonthlyProfit: number;
  paybackDays: number;
  recommendedRouter: {
    name: string;
    price: number;
    features: string[];
  };
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
}

export interface LoadBalanceRecommendation {
  locationName: string;
  currentLoad: number; // 0-100%
  maxCapacity: number;
  suggestedAction: "maintain" | "increase_price" | "reduce_price" | "add_router" | "promote";
  reasoning: string;
}

export class AutomationEngine {
  /**
   * Auto-adjust pricing based on sales data and demand patterns
   */
  autoAdjustPricing(
    salesHistory: SalesData[],
    predictions: DemandPrediction[],
    currentPackages: Array<{ name: string; price: number; locationName?: string }>
  ): PricingAdjustment[] {
    const adjustments: PricingAdjustment[] = [];

    for (const pred of predictions) {
      const locPackages = currentPackages.filter(
        (p) => !p.locationName || p.locationName === pred.locationName
      );

      for (const pkg of locPackages) {
        let suggestedPrice = pkg.price;
        let reason = "";
        let expectedImpact = "";
        let confidence = pred.confidence;

        // Factor 1: Trend-based adjustment
        if (pred.trend === "growing" && pred.confidence > 0.5) {
          suggestedPrice = Math.round(pkg.price * 1.08); // +8%
          reason = "Growing demand — price can increase";
          expectedImpact = `+${Math.round(pkg.price * 0.08)} TZS per sale`;
        } else if (pred.trend === "declining" && pred.confidence > 0.5) {
          suggestedPrice = Math.round(pkg.price * 0.92); // -8%
          reason = "Declining demand — reduce price to attract customers";
          expectedImpact = `Expected +${Math.round(pred.predictedDailySales * 0.2)} sales/day`;
        }

        // Factor 2: Peak hour pricing
        if (pred.peakHours.length > 0 && pred.confidence > 0.6) {
          // Suggest time-based pricing
          reason += `. Peak hours (${pred.peakHours.map((h) => `${h}:00`).join(", ")}) can support premium pricing`;
        }

        // Factor 3: Price elasticity estimate
        if (pred.predictedDailySales > 0) {
          const revenuePerCustomer = pred.predictedRevenue / pred.predictedDailySales;
          if (revenuePerCustomer < pkg.price * 0.8) {
            // Customers are paying less than expected — price may be too high
            suggestedPrice = Math.round(revenuePerCustomer * 1.1);
            reason = "Actual revenue per customer is below package price — adjust downward";
            confidence = Math.min(0.9, confidence + 0.1);
          }
        }

        if (suggestedPrice !== pkg.price) {
          adjustments.push({
            locationName: pred.locationName,
            packageName: pkg.name,
            currentPrice: pkg.price,
            suggestedPrice,
            reason,
            expectedImpact,
            confidence,
          });
        }
      }
    }

    return adjustments;
  }

  /**
   * Auto-generate voucher batches based on plan and demand
   */
  generateVoucherBatches(
    plan: { locationPlans: any[]; salesStyle: string },
    predictions: DemandPrediction[],
    daysAhead: number = 7
  ): VoucherBatch[] {
    const batches: VoucherBatch[] = [];
    const now = new Date();

    for (const locPlan of plan.locationPlans) {
      const pred = predictions.find((p) => p.locationName === locPlan.name);
      const dailySales = pred?.predictedDailySales || Math.ceil((locPlan.currentCustomers || 10) * 0.3);

      for (const pkg of locPlan.packages || []) {
        // Calculate batch size based on demand and days ahead
        const batchSize = Math.ceil(dailySales * daysAhead * 1.2); // 20% buffer
        const durationHours = pkg.durationHours || 24;

        // Set expiry based on sales style
        let expiryDays = 1;
        if (plan.salesStyle === "weekly") expiryDays = 7;
        else if (plan.salesStyle === "mixed") expiryDays = 3;

        const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

        batches.push({
          locationId: locPlan.locationId,
          locationName: locPlan.name,
          packageName: pkg.name,
          count: batchSize,
          durationHours,
          expiresAt,
          price: pkg.price,
        });
      }
    }

    return batches;
  }

  /**
   * Calculate ROI for expanding to a new location
   */
  calculateExpansionROI(
    newLocationName: string,
    existingPredictions: DemandPrediction[],
    currentPlan: { monthlyProfitTarget: number; monthlyRevenueTarget: number; totalCosts: number },
    routerOptions: Array<{ name: string; price: number; features: string[] }>
  ): ExpansionROI {
    // Estimate demand for new location based on existing locations
    const avgDailySales = existingPredictions.length > 0
      ? existingPredictions.reduce((sum, p) => sum + p.predictedDailySales, 0) / existingPredictions.length
      : 5;
    const avgPrice = existingPredictions.length > 0
      ? existingPredictions.reduce((sum, p) => sum + p.recommendedPrice, 0) / existingPredictions.length
      : 1500;

    // Conservative estimate: 70% of average
    const estimatedDailySales = Math.ceil(avgDailySales * 0.7);
    const estimatedMonthlyRevenue = estimatedDailySales * avgPrice * 30;

    // Costs: 1 router + subscription + ISP
    const cheapestRouter = routerOptions.length > 0
      ? routerOptions.reduce((min, r) => r.price < min.price ? r : min, routerOptions[0])
      : { name: "MikroTik hEX lite", price: 250000, features: ["Basic routing", "WiFi hotspot"] };

    const monthlySubscription = 8000; // Growth plan per router
    const estimatedMonthlyCosts = monthlySubscription + 15000; // ISP fiber estimate
    const estimatedMonthlyProfit = estimatedMonthlyRevenue - estimatedMonthlyCosts;

    // Payback period for router investment
    const paybackDays = estimatedMonthlyProfit > 0
      ? Math.ceil((cheapestRouter.price / estimatedMonthlyProfit) * 30)
      : 999;

    // Risk assessment
    let riskLevel: "low" | "medium" | "high" = "medium";
    let reasoning = "";

    if (existingPredictions.length === 0) {
      riskLevel = "high";
      reasoning = "No sales data from existing locations — high uncertainty. Start with a cheaper router.";
    } else if (estimatedMonthlyProfit > 50000) {
      riskLevel = "low";
      reasoning = `Strong estimated profit (${estimatedMonthlyProfit.toLocaleString()} TZS/mo) based on existing location performance.`;
    } else if (estimatedMonthlyProfit > 0) {
      riskLevel = "medium";
      reasoning = `Moderate estimated profit. Consider starting with fewer customers and growing.`;
    } else {
      riskLevel = "high";
      reasoning = `Estimated costs may exceed revenue. Consider a cheaper location or higher prices.`;
    }

    return {
      locationName: newLocationName,
      estimatedMonthlyRevenue,
      estimatedMonthlyCosts,
      estimatedMonthlyProfit,
      paybackDays,
      recommendedRouter: cheapestRouter,
      riskLevel,
      reasoning,
    };
  }

  /**
   * Recommend routers from the shop based on needs
   */
  recommendRouters(
    customerCount: number,
    budget: number,
    shopProducts: Array<{ name: string; price: number; description?: string; specs?: any }>
  ): Array<{ name: string; price: number; matchScore: number; reason: string }> {
    const recommendations: Array<{ name: string; price: number; matchScore: number; reason: string }> = [];

    for (const product of shopProducts) {
      let matchScore = 0;
      let reason = "";

      // Budget fit
      if (product.price <= budget) {
        matchScore += 30;
        reason = "Within budget";
      } else if (product.price <= budget * 1.2) {
        matchScore += 15;
        reason = "Slightly over budget";
      } else {
        matchScore -= 20;
        reason = "Over budget";
      }

      // Capacity fit based on customer count
      if (customerCount <= 20) {
        // Small location — entry-level router
        if (product.price < 500000) {
          matchScore += 25;
          reason += ", good for small location";
        }
      } else if (customerCount <= 50) {
        // Medium location — mid-range
        if (product.price >= 300000 && product.price < 1500000) {
          matchScore += 25;
          reason += ", good for medium location";
        }
      } else {
        // Large location — enterprise
        if (product.price >= 1000000) {
          matchScore += 25;
          reason += ", good for large location";
        }
      }

      // Value score (features per price)
      matchScore += 20; // Base score for being in shop

      if (matchScore > 0) {
        recommendations.push({
          name: product.name,
          price: product.price,
          matchScore,
          reason: reason.trim(),
        });
      }
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  /**
   * Multi-location load balancing recommendations
   */
  balanceLoad(
    locations: Array<{
      name: string;
      routers: number;
      customers: number;
      currentRevenue: number;
      targetRevenue: number;
    }>
  ): LoadBalanceRecommendation[] {
    const recommendations: LoadBalanceRecommendation[] = [];

    // Calculate total capacity and current load
    const totalCapacity = locations.reduce((sum, loc) => sum + loc.routers * 50, 0); // 50 customers per router
    const totalCustomers = locations.reduce((sum, loc) => sum + loc.customers, 0);
    const overallLoad = totalCapacity > 0 ? (totalCustomers / totalCapacity) * 100 : 0;

    for (const loc of locations) {
      const maxCapacity = loc.routers * 50;
      const currentLoad = maxCapacity > 0 ? (loc.customers / maxCapacity) * 100 : 0;
      const revenueRatio = loc.targetRevenue > 0 ? loc.currentRevenue / loc.targetRevenue : 0;

      let suggestedAction: LoadBalanceRecommendation["suggestedAction"] = "maintain";
      let reasoning = "";

      if (currentLoad > 80) {
        suggestedAction = "add_router";
        reasoning = `At ${Math.round(currentLoad)}% capacity. Add a router to handle more customers.`;
      } else if (currentLoad < 30 && revenueRatio < 0.7) {
        suggestedAction = "promote";
        reasoning = `Low utilization (${Math.round(currentLoad)}%) and below revenue target. Run a promotion.`;
      } else if (revenueRatio < 0.8) {
        suggestedAction = "reduce_price";
        reasoning = `Below revenue target. Consider reducing prices to attract more customers.`;
      } else if (revenueRatio > 1.2) {
        suggestedAction = "increase_price";
        reasoning = `Exceeding revenue target. Price can be increased.`;
      } else {
        suggestedAction = "maintain";
        reasoning = `Operating at ${Math.round(currentLoad)}% capacity, on track with revenue.`;
      }

      recommendations.push({
        locationName: loc.name,
        currentLoad: Math.round(currentLoad),
        maxCapacity,
        suggestedAction,
        reasoning,
      });
    }

    return recommendations;
  }
}
