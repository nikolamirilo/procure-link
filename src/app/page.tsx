import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { HeroAnimation } from "@/components/landing/hero-animation";
import { HowItWorksAnimation } from "@/components/landing/how-it-works-animation";
import {
  Truck,
  ShoppingCart,
  CalendarDays,
  Shield,
  Globe,
  Repeat,
  CreditCard,
  Zap,
  ArrowRight,
  Check,
  Users,
  Building2,
  ChevronRight,
  Search,
  Package,
  TrendingUp,
  Sparkles,
  Clock,
  MessageCircle,
  Map,
  Lock,
  Mail,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "One cart, every supplier",
    description:
      "Add products from any supplier in your network. Checkout once - we split it into the right orders behind the scenes.",
  },
  {
    icon: Repeat,
    title: "Automate the recurring stuff",
    description:
      "The salmon every Tuesday, the herbs every Thursday. Set it once and the orders place themselves on schedule.",
  },
  {
    icon: CalendarDays,
    title: "Delivery you can see",
    description:
      "A month-view calendar of every incoming delivery. Your kitchen knows what is landing and when, at a glance.",
  },
  {
    icon: Truck,
    title: "Slot-aware ordering",
    description:
      "Each supplier publishes their delivery windows. The app blocks dates they can't make - no more orders that quietly don't arrive.",
  },
  {
    icon: Shield,
    title: "Real audit trail",
    description:
      "Every status change, every payment update, every cancellation - timestamped and visible to both sides. No more 'who said what.'",
  },
  {
    icon: Globe,
    title: "Multi-currency by default",
    description:
      "Each supplier prices in their own currency. EUR, GBP, USD, RSD, CHF, CAD, AUD - the order respects whoever you are buying from.",
  },
];

const steps = [
  {
    step: "01",
    title: "Browse the catalog",
    description:
      "See products from every connected supplier in one place. Filter by category. Compare prices side-by-side.",
  },
  {
    step: "02",
    title: "Checkout once",
    description:
      "Add anything to one cart - even across five suppliers. Pick a delivery date. Confirm. We handle the splitting.",
  },
  {
    step: "03",
    title: "Track and receive",
    description:
      "Watch each order move through pending, confirmed, dispatched, delivered. Mark issues when they happen.",
  },
  {
    step: "04",
    title: "Automate what repeats",
    description:
      "Turn any cart into a recurring order. Weekly, biweekly, monthly. Edit anytime. Pause anytime.",
  },
];

const betaPromises = [
  { icon: Sparkles, label: "Free during beta" },
  { icon: Clock, label: "5-minute setup" },
  { icon: Shield, label: "EU-hosted infrastructure" },
  { icon: Lock, label: "No card required" },
];

const pilotBenefits = [
  {
    icon: MessageCircle,
    title: "Direct line to the founder",
    description:
      "Your messages get answered the same day. The product team is one person and you can talk to them.",
  },
  {
    icon: Map,
    title: "Shape the roadmap",
    description:
      "The features we ship next are the features pilot members ask for. You are not waiting in a queue behind enterprise.",
  },
  {
    icon: Lock,
    title: "Locked launch pricing",
    description:
      "Whatever we charge after beta, pilot members get 50% off for life. We will not surprise you with the bill.",
  },
];

const supplierTiers = [
  {
    name: "Free",
    price: "EUR 0",
    period: "/month",
    tagline: "Get listed and start receiving orders.",
    features: [
      "Up to 25 products",
      "Up to 20 orders / month",
      "Basic delivery scheduling",
      "1 team seat",
      "Email support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "EUR 49",
    period: "/month",
    tagline: "For suppliers running real order volume.",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "Full delivery scheduling",
      "Recurring-order fulfilment",
      "Verified-supplier badge",
      "Basic analytics",
      "Same-day email support",
    ],
    cta: "Choose Growth",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "EUR 99",
    period: "/month",
    tagline: "For larger suppliers and teams.",
    features: [
      "Everything in Growth",
      "Up to 5 team seats",
      "Advanced analytics",
      "Priority support + onboarding call",
    ],
    cta: "Choose Scale",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#beta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">The beta</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Join the beta
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-brand-50)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,var(--color-brand-100)_0%,transparent_30%)] pointer-events-none opacity-50" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground bg-background/80 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Private beta - cohort 1 open
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                Restaurant supply,{" "}
                <span className="gradient-text">simplified</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                One inbox for every supplier. Browse catalogs, place orders across vendors in a single checkout, and automate the recurring stuff. Built for kitchens tired of phone calls and spreadsheets.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] gap-2"
                >
                  Join the beta
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-border bg-background px-8 text-sm font-semibold hover:bg-muted transition-all active:scale-[0.98]"
                >
                  See how it works
                </a>
              </div>
              {/* Beta promises */}
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
                {betaPromises.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Right: illustration animation */}
            <div className="hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM / WHY NOW ===== */}
      <section className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                THE PROBLEM
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                Restaurant procurement still runs on{" "}
                <span className="gradient-text">WhatsApp and PDFs</span>
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Most kitchens manage 6 to 12 suppliers. Each one wants orders in their own format - WhatsApp, email, a PDF, a phone call before 9pm.
              </p>
              <p>
                Mistakes hide in that mess. A missed Tuesday order. A double-charge nobody catches until invoice day. A delivery slot the supplier never confirmed.
              </p>
              <p className="text-foreground font-medium">
                ProcureLink replaces the mess with one workflow both sides can see.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
              WHAT YOU GET
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              The whole procurement workflow,{" "}
              <span className="gradient-text">in one product</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Not a marketplace listing tool. Not a fancy order form. The full loop from discovery to delivery to repeat.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border bg-card p-7 premium-shadow hover:premium-shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 md:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                HOW IT WORKS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
                From sign-up to first order in{" "}
                <span className="gradient-text">under 10 minutes</span>
              </h2>
              <div className="space-y-8">
                {steps.map((step) => (
                  <div key={step.step} className="flex gap-5">
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <HowItWorksAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOR RESTAURANTS + SUPPLIERS ===== */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          {/* Restaurants */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
                FOR RESTAURANTS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Stop chasing your suppliers.{" "}
                <span className="gradient-text">Run procurement like a workflow.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Browse products from every supplier you work with. Compare at a glance. Order from five at once and pick a delivery day each. Set the salmon, the bread, the dairy to repeat on the right schedule and stop thinking about them.
              </p>
              <ul className="space-y-3">
                {[
                  "Catalogs from every supplier in your network",
                  "One cart across multiple suppliers, one checkout",
                  "Recurring orders on daily, weekly, or monthly cadence",
                  "Delivery calendar shows every incoming order at a glance",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Join the beta as a restaurant <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border">
              <div className="rounded-xl bg-card premium-shadow-lg overflow-hidden border">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground ml-2">Browse Products</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Search fresh produce, dairy, meat...</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Roma Tomatoes", price: "2.40", unit: "kg", color: "bg-red-100" },
                      { name: "Extra Virgin Olive Oil", price: "12.50", unit: "L", color: "bg-amber-100" },
                      { name: "Fresh Mozzarella", price: "8.90", unit: "kg", color: "bg-blue-50" },
                    ].map((p) => (
                      <div key={p.name} className="rounded-lg border p-3 space-y-2 hover:border-primary/30 transition-colors">
                        <div className={`h-14 ${p.color} rounded flex items-center justify-center`}>
                          <ShoppingCart className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-[11px] font-medium truncate">{p.name}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold">EUR {p.price}</span>
                          <span className="text-[9px] text-muted-foreground">/{p.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">3 items in cart</span>
                    </div>
                    <span className="text-xs font-bold text-primary">EUR 23.80</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border">
              <div className="rounded-xl bg-card premium-shadow-lg overflow-hidden border">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground ml-2">Supplier Dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Orders", value: "128", icon: Package, trend: "+12%" },
                      { label: "Revenue", value: "EUR 24.5k", icon: CreditCard, trend: "+8%" },
                      { label: "Customers", value: "47", icon: Users, trend: "+5" },
                    ].map((stat) => {
                      const SIcon = stat.icon;
                      return (
                        <div key={stat.label} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <SIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-emerald-600">{stat.trend}</span>
                          </div>
                          <p className="text-sm font-bold">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recent Orders</p>
                    {[
                      { restaurant: "La Bella Italia", items: 5, total: "EUR 186.40", status: "Confirmed" },
                      { restaurant: "Sakura Sushi Bar", items: 3, total: "EUR 94.20", status: "Pending" },
                      { restaurant: "Bistro Lumiere", items: 8, total: "EUR 312.00", status: "Dispatched" },
                    ].map((order) => (
                      <div key={order.restaurant} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${order.status === "Confirmed" ? "bg-blue-400" : order.status === "Pending" ? "bg-yellow-400" : "bg-green-400"}`} />
                          <span className="text-[11px] font-medium truncate">{order.restaurant}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{order.items} items</span>
                          <span className="text-[11px] font-bold">{order.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Monthly growth</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+23%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
                FOR SUPPLIERS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                A storefront that{" "}
                <span className="gradient-text">does the back-office for you</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                List your products. Set delivery slots by zone and weekday. Restaurants find you, place orders, and you work them through pending to delivered in one view. Recurring customers re-order on a schedule you never have to chase.
              </p>
              <ul className="space-y-3">
                {[
                  "Unlimited product listings with categories",
                  "Time-limited offers and promotions",
                  "Delivery slots by zone, day, and capacity",
                  "Payment status tracking with full audit trail",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Join the beta as a supplier <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSIDE THE BETA ===== */}
      <section id="beta" className="py-24 md:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
              INSIDE THE BETA
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              What you get for being{" "}
              <span className="gradient-text">early</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              We are not pretending to be bigger than we are. Here is the honest deal for pilot members.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pilotBenefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl border bg-card p-7 premium-shadow space-y-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Founder note */}
          <div className="mt-16 mx-auto max-w-3xl rounded-2xl border bg-card p-8 md:p-10 premium-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">A note from the founder</p>
                <p className="text-foreground leading-relaxed">
                  We are building this with a small cohort because the only way to get procurement right is to sit next to people doing it every day. If you join the beta, expect emails, calls, and the occasional "would this be useful?" before we ship something.
                </p>
                <p className="text-muted-foreground text-sm">
                  In return, you get a product shaped around your kitchen - not someone else's idea of one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
              PRICING
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Free during beta.{" "}
              <span className="gradient-text">Honest after.</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Restaurants order for free, forever. Suppliers pay a simple monthly fee once we launch. Pilot members lock 50% off for life.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Everything is free during beta. Prices below are indicative and apply after launch.
            </span>
          </div>

          <div className="max-w-3xl mx-auto mb-10">
            <div className="rounded-2xl border bg-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Restaurants</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order across every supplier, schedule deliveries, automate recurring orders. Always free.
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-3xl font-bold tracking-tight">Free</div>
                <div className="text-xs text-muted-foreground">forever</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-5xl mx-auto mb-6">
            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">For suppliers</p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {supplierTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl bg-card p-8 ${
                  tier.highlighted
                    ? "border-2 border-primary premium-shadow-lg"
                    : "border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">{tier.tagline}</p>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-bold tracking-tight whitespace-nowrap">{tier.price}</span>
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mt-8 flex-1">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`inline-flex w-full h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold transition-all active:scale-[0.98] gap-2 mt-8 ${
                    tier.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                      : "border-2 hover:bg-muted"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Annual billing saves two months. No transaction fees or commission - you keep what you sell. Pilot suppliers lock the Growth tier at EUR 24.50/month for life.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl bg-primary overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
            <div className="relative space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white">
                <Zap className="h-3.5 w-3.5" />
                Limited beta spots
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight">
                Ready to run procurement like a workflow?
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                Five minutes to set up. Free for as long as the beta runs. Real product, real founder, real conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-primary hover:bg-white/90 transition-all active:scale-[0.98] gap-2"
                >
                  Join the beta <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="mailto:hello@procure-link.com"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/30 px-8 text-sm font-semibold text-primary-foreground hover:bg-white/10 transition-all active:scale-[0.98] gap-2"
                >
                  <Mail className="h-4 w-4" /> Talk to the founder
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Restaurant procurement without the phone calls. Currently in private beta.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#beta" className="hover:text-foreground transition-colors">Inside the beta</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="mailto:hello@procure-link.com" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Join the beta</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ProcureLink. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Users className="h-4 w-4" />
              <Building2 className="h-4 w-4" />
              <Globe className="h-4 w-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
