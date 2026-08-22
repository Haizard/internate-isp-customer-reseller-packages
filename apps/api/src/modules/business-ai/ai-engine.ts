/**
 * Rule-based AI Business Engine
 * Conversational planner that helps resellers hit profit targets.
 */

export interface ConversationState {
  step: number;
  answers: Record<string, unknown>;
  planGenerated: boolean;
}

export interface AIResponse {
  message: string;
  question?: string;
  options?: string[];
  type: "question" | "analysis" | "plan" | "suggestion";
  metadata?: Record<string, unknown>;
}

// Subscription costs per router
const SUBSCRIPTION_COST_PER_ROUTER = 10000; // TZS per router per month

// Steps in the conversation
const STEPS = [
  {
    key: "profitTarget",
    question: "Habari! 🎯 Niko huku kukusaidia kupanga biashara yako ya internet. Kwanza, unafanya kiasi gani kwenye faida kwa mwezi?",
    followUp: "Kwa mfano: 100,000 TZS, 200,000 TZS, au lengo lingine?",
    type: "number" as const,
  },
  {
    key: "locationCount",
    question: "Sawa! Unao ofisi/nguo ngapi za kuuza internet?",
    followUp: "Kila ofisi ina jina na idadi ya wateja?",
    type: "number" as const,
  },
  {
    key: "locations",
    question: "Sawa! Ni vyakupanga kila ofisi. Kila ofisi ina jina gani, router ngapi, na wateja wangapi kwa sasa?",
    followUp: "Mfano: Mbezi - 2 routers, 30 wateja. Arusha - 1 router, 15 wateja.",
    type: "locations" as const,
  },
  {
    key: "ispCost",
    question: "Unalipa kiasi gani kwa mwezi kwa fiber ya ISP?",
    followUp: "Hii ni gharama yako ya ISP, si ya NetMaster.",
    type: "number" as const,
  },
  {
    key: "currentPlan",
    question: "Mpango gani wa NetMaster una sasa? (Starter/Growth/Enterprise)",
    options: ["Starter (Free)", "Growth (8,000/router)", "Enterprise (25,000/router)"],
    type: "choice" as const,
  },
  {
    key: "salesStyle",
    question: "Unapendelea mauzo ya kila siku au ya kundi kwa wiki?",
    options: ["Kila siku (steady daily income)", "Kwa wiki (bulk sales)", "Mchanganyiko"],
    type: "choice" as const,
  },
];

export class AIEngine {
  /**
   * Process a user message and return the next AI response
   */
  processMessage(
    state: ConversationState,
    userMessage: string
  ): { response: AIResponse; newState: ConversationState } {
    const newState = { ...state, answers: { ...state.answers } };

    // If plan is already generated, handle follow-up questions
    if (state.planGenerated) {
      return this.handleFollowUp(state, userMessage);
    }

    // Process current step answer
    if (state.step > 0) {
      const prevStep = STEPS[state.step - 1];
      const answer = this.parseAnswer(prevStep.key, userMessage, prevStep.type);
      newState.answers[prevStep.key] = answer;
    }

    // Move to next step
    if (state.step < STEPS.length) {
      const currentStep = STEPS[state.step];
      newState.step = state.step + 1;

      const response: AIResponse = {
        message: currentStep.question,
        question: currentStep.followUp,
        type: "question",
        options: currentStep.options,
      };

      return { response, newState };
    }

    // All questions answered — generate the plan
    newState.planGenerated = true;
    const plan = this.generatePlan(newState.answers);

    return {
      response: {
        message: plan.summary,
        type: "plan",
        metadata: plan,
      },
      newState,
    };
  }

  /**
   * Parse user answer based on step type
   */
  private parseAnswer(key: string, value: string, type: string): unknown {
    const cleaned = value.replace(/[^\d.,]/g, "").replace(/,/g, "");
    const num = parseInt(cleaned, 10);

    switch (key) {
      case "profitTarget":
        return num || 100000;
      case "locationCount":
        return num || 1;
      case "locations":
        return this.parseLocations(value);
      case "ispCost":
        return num || 0;
      case "currentPlan":
        return value.includes("Growth") ? "Growth" : value.includes("Enterprise") ? "Enterprise" : "Starter";
      case "salesStyle":
        return value.includes("wiki") ? "weekly" : value.includes("siku") ? "daily" : "mixed";
      default:
        return value;
    }
  }

  /**
   * Parse location input from free text
   */
  private parseLocations(input: string): Array<{ name: string; routers: number; customers: number }> {
    const locations: Array<{ name: string; routers: number; customers: number }> = [];
    const lines = input.split(/[;,\n]/).filter(Boolean);

    for (const line of lines) {
      const match = line.match(/(\w+)\s*[-:]\s*(\d+)\s*routers?\s*[-:,]\s*(\d+)\s*(wateja|customers?)/i);
      if (match) {
        locations.push({
          name: match[1],
          routers: parseInt(match[2]),
          customers: parseInt(match[3]),
        });
      } else {
        // Fallback: try to extract any numbers
        const nums = line.match(/\d+/g);
        if (nums && nums.length >= 2) {
          locations.push({
            name: line.replace(/\d+/g, "").replace(/[-:,]/g, "").trim() || `Location ${locations.length + 1}`,
            routers: parseInt(nums[0]),
            customers: parseInt(nums[1]),
          });
        }
      }
    }

    // If no locations parsed, create default from locationCount
    if (locations.length === 0) {
      locations.push({ name: "Main Office", routers: 1, customers: 10 });
    }

    return locations;
  }

  /**
   * Generate the complete business plan
   */
  private generatePlan(answers: Record<string, unknown>) {
    const profitTarget = (answers.profitTarget as number) || 100000;
    const ispCost = (answers.ispCost as number) || 0;
    const planType = (answers.currentPlan as string) || "Growth";
    const locations = (answers.locations as Array<{ name: string; routers: number; customers: number }>) || [];
    const salesStyle = (answers.salesStyle as string) || "daily";

    // Calculate total routers and subscription cost
    const totalRouters = locations.reduce((sum, loc) => sum + loc.routers, 0);
    const subscriptionCost = planType === "Enterprise"
      ? totalRouters * 25000
      : planType === "Growth"
        ? totalRouters * 8000
        : 0;

    // Total costs
    const totalCosts = ispCost + subscriptionCost;

    // Revenue needed = costs + profit target
    const revenueTarget = totalCosts + profitTarget;

    // Revenue per location (weighted by customer count)
    const totalCustomers = locations.reduce((sum, loc) => sum + loc.customers, 0);

    const locationPlans = locations.map((loc) => {
      const weight = totalCustomers > 0 ? loc.customers / totalCustomers : 1 / locations.length;
      const monthlyRevenue = Math.round(revenueTarget * weight);
      const dailyRevenue = Math.round(monthlyRevenue / 30);

      // Generate package recommendations based on location size and sales style
      const packages = this.generatePackages(loc, dailyRevenue, salesStyle);

      return {
        locationId: loc.name,
        name: loc.name,
        routers: loc.routers,
        currentCustomers: loc.customers,
        monthlyRevenueTarget: monthlyRevenue,
        dailyRevenueTarget: dailyRevenue,
        packages,
        recommendedVoucherBatchSize: Math.ceil(dailyRevenue / (packages[0]?.price || 1500) * 7),
        voucherExpiryDays: salesStyle === "daily" ? 1 : salesStyle === "weekly" ? 7 : 3,
      };
    });

    // Generate summary
    const summary = this.formatPlanSummary(
      profitTarget, totalCosts, ispCost, subscriptionCost,
      revenueTarget, locations, locationPlans, totalRouters
    );

    return {
      summary,
      profitTarget,
      totalCosts,
      costs: { ispFiber: ispCost, netmasterSubscription: subscriptionCost, other: 0 },
      revenueTarget,
      locationPlans,
      totalRouters,
      planType,
      salesStyle,
    };
  }

  /**
   * Generate package recommendations for a location
   */
  private generatePackages(
    loc: { name: string; routers: number; customers: number },
    dailyRevenue: number,
    salesStyle: string
  ) {
    const avgCustomersPerRouter = loc.routers > 0 ? Math.ceil(loc.customers / loc.routers) : 10;

    // Base price depends on location size and style
    const baseDailyPrice = salesStyle === "daily" ? 1500 : salesStyle === "weekly" ? 1000 : 1200;

    return [
      {
        name: "Daily Pass",
        price: baseDailyPrice,
        duration: "1 day",
        durationHours: 24,
        targetSalesPerDay: Math.ceil(dailyRevenue * 0.4 / baseDailyPrice),
      },
      {
        name: "3-Day Pass",
        price: baseDailyPrice * 2.5,
        duration: "3 days",
        durationHours: 72,
        targetSalesPerDay: Math.ceil(dailyRevenue * 0.3 / (baseDailyPrice * 2.5)),
      },
      {
        name: "Weekly Pass",
        price: baseDailyPrice * 5,
        duration: "7 days",
        durationHours: 168,
        targetSalesPerDay: Math.ceil(dailyRevenue * 0.3 / (baseDailyPrice * 5)),
      },
    ];
  }

  /**
   * Format the plan summary message
   */
  private formatPlanSummary(
    profitTarget: number,
    totalCosts: number,
    ispCost: number,
    subscriptionCost: number,
    revenueTarget: number,
    locations: Array<{ name: string; routers: number; customers: number }>,
    locationPlans: Array<{ name: string; monthlyRevenueTarget: number; packages: Array<{ name: string; price: number; targetSalesPerDay: number }> }>,
    totalRouters: number
  ): string {
    const lines: string[] = [];

    lines.push("📊 **Mpango Wako wa Biashara**");
    lines.push("");
    lines.push("**Gharama Zako:**");
    lines.push(`- Fiber ya ISP: ${ispCost.toLocaleString()} TZS/mwezi`);
    lines.push(`- NetMaster (${totalRouters} routers): ${subscriptionCost.toLocaleString()} TZS/mwezi`);
    lines.push(`- Jumla ya gharama: ${totalCosts.toLocaleString()} TZS/mwezi`);
    lines.push("");
    lines.push("**Lengo:**");
    lines.push(`- Faida unayotaka: ${profitTarget.toLocaleString()} TZS/mwezi`);
    lines.push(`- Mapato yanayohitajika: ${revenueTarget.toLocaleString()} TZS/mwezi`);
    lines.push("");
    lines.push("**Mpango kwa kila ofisi:**");

    for (let i = 0; i < locationPlans.length; i++) {
      const loc = locationPlans[i];
      const orig = locations[i];
      lines.push("");
      lines.push(`📍 **${loc.name}** (${orig.routers} routers, ${orig.customers} wateja sasa)`);
      lines.push(`   Lengo la mapato: ${loc.monthlyRevenueTarget.toLocaleString()} TZS/mwezi`);
      lines.push(`   Mapato ya siku: ${Math.round(loc.monthlyRevenueTarget / 30).toLocaleString()} TZS`);
      for (const pkg of loc.packages) {
        lines.push(`   - ${pkg.name}: ${pkg.price.toLocaleString()} TZS (lengo: ${pkg.targetSalesPerDay} mauzo/siku)`);
      }
    }

    lines.push("");
    lines.push("✅ **Hii ndiyo iliyopendekezwa. Unaweza kubadilisha nambari yoyote kabla ya kuthibitisha.**");
    lines.push("");
    lines.push("Chagua kitu cha kubadilisha au bonyeza **Thibitisha Mpango** kuendelea.");

    return lines.join("\n");
  }

  /**
   * Handle follow-up messages after plan is generated
   */
  private handleFollowUp(
    state: ConversationState,
    userMessage: string
  ): { response: AIResponse; newState: ConversationState } {
    const msg = userMessage.toLowerCase();

    if (msg.includes("thibitisha") || msg.includes("confirm") || msg.includes("apply") || msg.includes("sawa")) {
      return {
        response: {
          message: "✅ **Mpango umethibitishwa!**\n\nSasa ninaunda:",
          type: "suggestion",
          metadata: { action: "apply_plan" },
        },
        newState: state,
      };
    }

    if (msg.includes("badilisha") || msg.includes("edit") || msg.includes("change")) {
      return {
        response: {
          message: "Kubadilisha nini? andika nambari mpya au sehemu unayotaka kubadilisha.",
          type: "question",
        },
        newState: state,
      };
    }

    if (msg.includes("jangwa") || msg.includes("expand") || msg.includes("mpya")) {
      return {
        response: {
          message: "🌍 **Mpango wa Ukuaji**\n\nKulingana na ukuaji wako, ninapendekeza kuongeza ofisi mpya. Ni mji upi unafikiria?",
          type: "suggestion",
          metadata: { action: "suggest_expansion" },
        },
        newState: state,
      };
    }

    return {
      response: {
        message: "Unaweza:\n- **Thibitisha** - kuamsha mpango\n- **Badilisha** - kubadilisha nambari\n- **Ongeza** - kuongeza ofisi mpya",
        type: "question",
      },
      newState: state,
    };
  }
}
