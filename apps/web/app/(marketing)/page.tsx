"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "📡",
    title: "Multi-Location Management",
    description: "Manage offices across towns and cities from one dashboard. Each location gets its own routers, vouchers, and customer base.",
    color: "blue",
  },
  {
    icon: "🎫",
    title: "Instant Voucher System",
    description: "Generate and sell WiFi vouchers in seconds. Set duration, data caps, and pricing per package — customers connect instantly.",
    color: "green",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    description: "Track revenue per location, per router, per customer. Export CSV reports and monitor your network health in real time.",
    color: "purple",
  },
  {
    icon: "🎨",
    title: "White-Label Branding",
    description: "Your brand, your customers. Customize colors, logos, and welcome messages on the customer-facing portal.",
    color: "teal",
  },
  {
    icon: "💰",
    title: "Revenue Tracking",
    description: "See exactly how much each office and package earns. Track MRR, customer lifetime value, and subscription renewals automatically.",
    color: "orange",
  },
  {
    icon: "🔒",
    title: "Secure & Reliable",
    description: "Enterprise-grade security with JWT auth, rate limiting, and automatic subscription expiration. Your network stays protected.",
    color: "red",
  },
];

const STEPS = [
  { num: "01", title: "Sign Up Free", desc: "Create your reseller account in 30 seconds. No approval needed — start immediately." },
  { num: "02", title: "Add Locations", desc: "Set up your offices. Each location gets a unique hotspot portal your customers can access." },
  { num: "03", title: "Connect Routers", desc: "Register your MikroTik routers. Link them to locations and start managing bandwidth." },
  { num: "04", title: "Start Selling", desc: "Create packages, generate vouchers, and watch your revenue grow — all from one dashboard." },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for testing the waters",
    features: ["Up to 2 routers", "5% voucher commission", "Basic dashboard", "Customer management"],
    cta: "Get Started Free",
    accent: false,
  },
  {
    name: "Growth",
    price: "8,000",
    period: "TZS/router/mo",
    desc: "For resellers ready to scale",
    features: ["Unlimited routers", "0% commission", "Multi-location support", "White-label branding", "Advanced analytics", "Priority support"],
    cta: "Start Growing",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "25,000",
    period: "TZS/router/mo",
    desc: "For large-scale operations",
    features: ["Everything in Growth", "API access", "Custom SLA", "Dedicated support", "Custom integrations", "White-label portal"],
    cta: "Contact Sales",
    accent: false,
  },
];

const STATS = [
  { value: "500+", label: "Active Resellers" },
  { value: "50K+", label: "Customers Served" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "24/7", label: "Support Available" },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 pt-20 pb-16">
        {/* Decorative background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[var(--accent-blue)] opacity-[0.07] blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--accent-purple)] opacity-[0.06] blur-[100px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[var(--accent-teal)] opacity-[0.04] blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-sm font-medium text-[var(--accent-blue)]">Trusted by 500+ resellers across East Africa</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            <span className="text-[var(--text-primary)]">Run your </span>
            <span className="text-gradient">internet business</span>
            <br />
            <span className="text-[var(--text-primary)]">from </span>
            <span className="text-gradient-purple">one platform</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            NetMaster lets resellers manage multiple locations, sell WiFi vouchers, 
            track revenue, and grow their network — all from a single beautiful dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-[var(--grad-blue)] text-white font-bold text-lg shadow-lg shadow-[var(--accent-blue)]/25 hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 hover:scale-[1.02] transition-all duration-300"
            >
              Start Selling Today →
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 rounded-2xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--glass-surface-strong)] transition-all duration-300"
            >
              Browse Router Store
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl px-4 py-5 text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-gradient">{stat.value}</div>
                <div className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[var(--accent-blue)] uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-3">
              Four steps to your first sale
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[var(--accent-blue)]/30 to-[var(--accent-blue)]/5" />
                )}
                <div className="glass rounded-2xl p-6 text-center relative z-10 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--grad-blue)] flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-4 shadow-lg shadow-[var(--accent-blue)]/20">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[var(--accent-purple)] uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-3">
              Everything you need to grow
            </h2>
            <p className="text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
              From voucher generation to revenue analytics — one platform handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="glass rounded-2xl p-7 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-[var(--tint-${feat.color})] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ VISUAL SHOWCASE ═══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[var(--accent-blue)] opacity-10 blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[var(--accent-purple)] opacity-10 blur-[80px]" />

            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-sm font-semibold text-[var(--accent-teal)] uppercase tracking-widest">Multi-Location</span>
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mt-3 mb-4">
                  Manage 5 offices like managing 1
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                  Whether your offices are in different towns or across cities, NetMaster 
                  brings them all into one view. See revenue, customers, and router status 
                  for every location — side by side.
                </p>
                <ul className="space-y-3">
                  {["Per-location revenue tracking", "Location-specific voucher batches", "Individual hotspot portals", "Cross-location analytics"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)] flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dashboard preview mockup */}
              <div className="glass-strong rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-orange)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
                  <span className="ml-2 text-xs text-[var(--text-tertiary)]">Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Mbezi Shop", value: "TZS 2.4M", color: "blue" },
                    { label: "Arusha Center", value: "TZS 3.1M", color: "green" },
                    { label: "Moshi Branch", value: "TZS 1.8M", color: "purple" },
                    { label: "Dodoma Office", value: "TZS 950K", color: "teal" },
                  ].map((loc) => (
                    <div key={loc.label} className={`rounded-xl bg-[var(--tint-${loc.color})] p-3`}>
                      <div className="text-xs text-[var(--text-secondary)]">{loc.label}</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">{loc.value}</div>
                    </div>
                  ))}
                </div>
                <div className="h-2 rounded-full bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-green)] to-[var(--accent-purple)] opacity-30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="py-20 px-4" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[var(--accent-orange)] uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-3">
              Simple, transparent pricing
            </h2>
            <p className="text-[var(--text-secondary)] mt-3">Start free, upgrade when you&apos;re ready to scale.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-7 transition-all duration-300 hover:scale-[1.01] ${
                  plan.accent
                    ? "bg-[var(--grad-blue)] text-white shadow-xl shadow-[var(--accent-blue)]/20 ring-2 ring-[var(--accent-blue)]/30 relative"
                    : "glass"
                }`}
              >
                {plan.accent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-[var(--accent-blue)] text-xs font-bold shadow-md">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.accent ? "text-white" : "text-[var(--text-primary)]"}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.accent ? "text-white/70" : "text-[var(--text-secondary)]"}`}>{plan.desc}</p>
                <div className="mt-5 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.accent ? "text-white" : "text-[var(--text-primary)]"}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ml-1 ${plan.accent ? "text-white/60" : "text-[var(--text-secondary)]"}`}>{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.accent ? "text-white/90" : "text-[var(--text-secondary)]"}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${plan.accent ? "bg-white/20" : "bg-[var(--accent-green)]/15 text-[var(--accent-green)]"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-3 rounded-xl text-center font-semibold transition-all duration-300 ${
                    plan.accent
                      ? "bg-white text-[var(--accent-blue)] hover:bg-white/90"
                      : "glass hover:bg-[var(--glass-surface-strong)] text-[var(--text-primary)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[var(--accent-blue)] opacity-10 blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-[var(--accent-purple)] opacity-10 blur-[60px]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-4">
                Ready to grow your network?
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                Join hundreds of resellers across Tanzania and East Africa. Start selling WiFi vouchers in minutes, not months.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-2xl bg-[var(--grad-blue)] text-white font-bold text-lg shadow-lg shadow-[var(--accent-blue)]/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/blog"
                  className="px-8 py-4 rounded-2xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--glass-surface-strong)] transition-all duration-300"
                >
                  Read Our Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
