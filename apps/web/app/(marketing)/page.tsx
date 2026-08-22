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

/* WiFi Signal SVG Component */
function WifiSignal({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
      <circle cx="60" cy="90" r="6" fill="currentColor" opacity="0.8" />
      <path d="M42 72a25 25 0 0 1 36 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <path d="M30 60a42 42 0 0 1 60 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <path d="M18 48a58 58 0 0 1 84 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}

/* Network Topology SVG */
function NetworkTopology({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" className={className}>
      {/* Central node */}
      <circle cx="200" cy="100" r="12" fill="currentColor" opacity="0.3" />
      <circle cx="200" cy="100" r="6" fill="currentColor" opacity="0.6" />
      {/* Lines to other nodes */}
      <line x1="200" y1="100" x2="80" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="100" x2="320" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="100" x2="60" y2="160" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="100" x2="340" y2="160" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="100" x2="200" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="100" x2="200" y2="180" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      {/* Outer nodes */}
      <circle cx="80" cy="40" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="320" cy="40" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="60" cy="160" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="340" cy="160" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="200" cy="20" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="200" cy="180" r="8" fill="currentColor" opacity="0.2" />
      {/* Sub-nodes */}
      <line x1="80" y1="40" x2="30" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <line x1="80" y1="40" x2="40" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <line x1="320" y1="40" x2="370" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <line x1="320" y1="40" x2="360" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <circle cx="30" cy="20" r="4" fill="currentColor" opacity="0.1" />
      <circle cx="40" cy="70" r="4" fill="currentColor" opacity="0.1" />
      <circle cx="370" cy="20" r="4" fill="currentColor" opacity="0.1" />
      <circle cx="360" cy="70" r="4" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background image layer */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/92 via-[#0d1f3c]/88 to-[#0a1628]/95" />
          {/* Colored accent overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-blue)]/10 via-transparent to-[var(--accent-purple)]/8" />
        </div>

        {/* Decorative WiFi signals */}
        <WifiSignal className="absolute top-20 right-10 text-[var(--accent-blue)] opacity-20 animate-pulse" size={180} />
        <WifiSignal className="absolute bottom-32 left-8 text-[var(--accent-teal)] opacity-15" size={140} />
        <WifiSignal className="absolute top-40 left-1/4 text-[var(--accent-blue)] opacity-10" size={100} />

        {/* Network topology background */}
        <NetworkTopology className="absolute inset-0 w-full h-full text-white opacity-[0.06]" />

        {/* Floating router icons */}
        <div className="absolute top-1/4 right-[15%] w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-3xl animate-[nudge_4.5s_ease-in-out_infinite]">
          📡
        </div>
        <div className="absolute bottom-1/3 left-[10%] w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-2xl">
          🔌
        </div>
        <div className="absolute top-[60%] right-[8%] w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xl">
          🌐
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 pt-20 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-sm font-medium text-white/80">Trusted by 500+ resellers across East Africa</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-white">
            Run your{" "}
            <span className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)] bg-clip-text text-transparent">
              internet business
            </span>
            <br />
            from{" "}
            <span className="bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent">
              one platform
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            NetMaster lets resellers manage multiple locations, sell WiFi vouchers,
            track revenue, and grow their network — all from a single dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-[var(--grad-blue)] text-white font-bold text-lg shadow-lg shadow-[var(--accent-blue)]/30 hover:shadow-xl hover:shadow-[var(--accent-blue)]/40 hover:scale-[1.02] transition-all duration-300"
            >
              Start Selling Today →
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 font-semibold text-white hover:bg-white/15 transition-all duration-300"
            >
              Browse Router Store
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-5 text-center">
                <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)] bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
      </section>

      {/* ═══════════ NETWORK SHOWCASE ═══════════ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Image side */}
              <div className="relative h-64 md:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80"
                  alt="Network infrastructure"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--glass-surface)]" />
              </div>
              {/* Content side */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <span className="text-sm font-semibold text-[var(--accent-teal)] uppercase tracking-widest mb-3">Built for Resellers</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-4">
                  From one office to five cities
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                  Whether your offices are in different towns or across cities, NetMaster
                  brings them all into one view. See revenue, customers, and router status
                  for every location — side by side.
                </p>
                <ul className="space-y-3">
                  {["Per-location revenue tracking", "Location-specific voucher batches", "Individual hotspot portals", "Cross-location analytics"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)] flex items-center justify-center text-xs shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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

      {/* ═══════════ EQUIPMENT SHOWCASE ═══════════ */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[var(--accent-blue)] opacity-[0.03] blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[var(--accent-orange)] uppercase tracking-widest">Compatible Hardware</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-3">
              Works with your MikroTik routers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: "https://images.unsplash.com/photo-1580894742597-87bc870ddb17?w=600&q=80", name: "hEX lite", desc: "Entry-level router for small offices", price: "From 250,000 TZS" },
              { img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80", name: "hEX refresh", desc: "Mid-range for growing resellers", price: "From 450,000 TZS" },
              { img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", name: "RB4011 / RB5009", desc: "Enterprise for high-traffic networks", price: "From 1,200,000 TZS" },
            ].map((item) => (
              <Link key={item.name} href="/shop">
                <div className="glass rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                  <div className="h-48 overflow-hidden relative">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-xs font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">MikroTik</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{item.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{item.desc}</p>
                    <p className="text-sm font-bold text-[var(--accent-blue)] mt-2">{item.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/shop" className="inline-flex px-6 py-3 rounded-xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--glass-surface-strong)] transition-all">
              View All Routers →
            </Link>
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
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${plan.accent ? "bg-white/20" : "bg-[var(--accent-green)]/15 text-[var(--accent-green)]"}`}>✓</span>
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
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background image */}
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0d1f3c]/85 to-[#0a1628]/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-10 md:p-14 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-6">
                <WifiSignal className="text-[var(--accent-blue)] opacity-80" size={20} />
                <span className="text-sm font-medium text-white/80">Join the network</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Ready to grow your network?
              </h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Join hundreds of resellers across Tanzania and East Africa. Start selling WiFi vouchers in minutes, not months.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-2xl bg-[var(--grad-blue)] text-white font-bold text-lg shadow-lg shadow-[var(--accent-blue)]/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/blog"
                  className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 font-semibold text-white hover:bg-white/15 transition-all duration-300"
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
