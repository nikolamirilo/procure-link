import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { HeroAnimation } from "@/components/landing/hero-animation";
import { HowItWorksAnimation } from "@/components/landing/how-it-works-animation";
import {
  Reveal,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverLift,
} from "@/components/landing/motion";
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
  { icon: ShoppingCart, titleKey: "featureCartTitle", descKey: "featureCartDesc" },
  { icon: Repeat, titleKey: "featureRecurringTitle", descKey: "featureRecurringDesc" },
  { icon: CalendarDays, titleKey: "featureCalendarTitle", descKey: "featureCalendarDesc" },
  { icon: Truck, titleKey: "featureSlotsTitle", descKey: "featureSlotsDesc" },
  { icon: Shield, titleKey: "featureAuditTitle", descKey: "featureAuditDesc" },
  { icon: Globe, titleKey: "featureCurrencyTitle", descKey: "featureCurrencyDesc" },
];

const steps = [
  { step: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { step: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { step: "03", titleKey: "step3Title", descKey: "step3Desc" },
  { step: "04", titleKey: "step4Title", descKey: "step4Desc" },
];

const betaPromises = [
  { icon: Sparkles, labelKey: "betaPromiseFree" },
  { icon: Clock, labelKey: "betaPromiseSetup" },
  { icon: Shield, labelKey: "betaPromiseEu" },
  { icon: Lock, labelKey: "betaPromiseNoCard" },
];

const pilotBenefits = [
  { icon: MessageCircle, titleKey: "pilotFounderTitle", descKey: "pilotFounderDesc" },
  { icon: Map, titleKey: "pilotRoadmapTitle", descKey: "pilotRoadmapDesc" },
  { icon: Lock, titleKey: "pilotPriceTitle", descKey: "pilotPriceDesc" },
];

// Aligned with src/lib/plans.ts and docs/sql/007_subscriptions.sql.
const supplierTiers = [
  {
    name: "Basic",
    priceRsd: "2.900 RSD",
    priceEur: "25 EUR",
    taglineKey: "tierBasicTagline",
    featureKeys: [
      "tierBasicFeature1",
      "tierBasicFeature2",
      "tierBasicFeature3",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    priceRsd: "5.900 RSD",
    priceEur: "49 EUR",
    taglineKey: "tierProTagline",
    featureKeys: [
      "tierProFeature1",
      "tierProFeature2",
      "tierProFeature3",
      "tierProFeature4",
    ],
    highlighted: true,
  },
];

export default async function HomePage() {
  const t = await getTranslations("landing");
  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("navFeatures")}</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("navHowItWorks")}</a>
            <a href="#beta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("navBeta")}</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("navPricing")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              {t("navSignIn")}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              {t("ctaJoinBeta")}
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
            <FadeIn className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground bg-background/80 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {t("heroBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                {t("heroTitle")}{" "}
                <span className="gradient-text">{t("heroTitleHighlight")}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] gap-2"
                >
                  {t("ctaJoinBeta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-border bg-background px-8 text-sm font-semibold hover:bg-muted transition-all active:scale-[0.98]"
                >
                  {t("heroCtaHow")}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
                {betaPromises.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.labelKey} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{t(p.labelKey)}</span>
                    </div>
                  );
                })}
              </div>
            </FadeIn>
            <FadeIn delay={0.2} className="hidden lg:block">
              <HeroAnimation />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
            <Reveal>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                {t("problemBadge")}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {t("problemTitle")}{" "}
                <span className="gradient-text">{t("problemTitleHighlight")}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {t("problemP1")}
              </p>
              <p>
                {t("problemP2")}
              </p>
              <p className="text-foreground font-medium">
                {t("problemP3")}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                {t("featuresBadge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t("featuresTitle")}{" "}
                <span className="gradient-text">{t("featuresTitleHighlight")}</span>
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                {t("featuresSubtitle")}
              </p>
            </div>
          </Reveal>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.titleKey}>
                  <HoverLift className="h-full">
                    <div className="group relative h-full rounded-2xl border bg-card p-7 premium-shadow hover:premium-shadow-lg transition-shadow">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{t(feature.titleKey)}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{t(feature.descKey)}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 md:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                {t("howBadge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
                {t("howTitle")}{" "}
                <span className="gradient-text">{t("howTitleHighlight")}</span>
              </h2>
              <Stagger className="space-y-8">
                {steps.map((step) => (
                  <StaggerItem key={step.step}>
                    <div className="flex gap-5">
                      <div className="shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{t(step.titleKey)}</h3>
                        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{t(step.descKey)}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
                {t("restaurantsBadge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                {t("restaurantsTitle")}{" "}
                <span className="gradient-text">{t("restaurantsTitleHighlight")}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("restaurantsBody")}
              </p>
              <ul className="space-y-3">
                {[
                  "restaurantsBullet1",
                  "restaurantsBullet2",
                  "restaurantsBullet3",
                  "restaurantsBullet4",
                ].map((itemKey) => (
                  <li key={itemKey} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {t(itemKey)}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                {t("restaurantsCta")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border">
              <div className="rounded-xl bg-card premium-shadow-lg overflow-hidden border">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground ml-2">{t("mockBrowseTitle")}</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("mockBrowseSearch")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { nameKey: "mockProductTomato", price: "280", unit: "kg", color: "bg-red-100" },
                      { nameKey: "mockProductOliveOil", price: "1.450", unit: "l", color: "bg-amber-100" },
                      { nameKey: "mockProductMozzarella", price: "1.040", unit: "kg", color: "bg-blue-50" },
                    ].map((p) => (
                      <div key={p.nameKey} className="rounded-lg border p-3 space-y-2 hover:border-primary/30 transition-colors">
                        <div className={`h-14 ${p.color} rounded flex items-center justify-center`}>
                          <ShoppingCart className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-[11px] font-medium truncate">{t(p.nameKey)}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold">{p.price} RSD</span>
                          <span className="text-[9px] text-muted-foreground">/{p.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">{t("mockCartItems")}</span>
                    </div>
                    <span className="text-xs font-bold text-primary">2.770 RSD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border">
              <div className="rounded-xl bg-card premium-shadow-lg overflow-hidden border">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground ml-2">{t("mockDashTitle")}</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { labelKey: "mockStatOrders", value: "128", icon: Package, trend: "+12%" },
                      { labelKey: "mockStatRevenue", value: "1,4M RSD", icon: CreditCard, trend: "+8%" },
                      { labelKey: "mockStatCustomers", value: "47", icon: Users, trend: "+5" },
                    ].map((stat) => {
                      const SIcon = stat.icon;
                      return (
                        <div key={stat.labelKey} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <SIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-emerald-600">{stat.trend}</span>
                          </div>
                          <p className="text-sm font-bold">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground">{t(stat.labelKey)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("mockRecentOrders")}</p>
                    {[
                      { restaurant: "La Bella Italia", items: 5, total: "21.040 RSD", status: "Confirmed" },
                      { restaurant: "Sakura Sushi Bar", items: 3, total: "10.640 RSD", status: "Pending" },
                      { restaurant: "Bistro Lumiere", items: 8, total: "35.240 RSD", status: "Dispatched" },
                    ].map((order) => (
                      <div key={order.restaurant} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${order.status === "Confirmed" ? "bg-blue-400" : order.status === "Pending" ? "bg-yellow-400" : "bg-green-400"}`} />
                          <span className="text-[11px] font-medium truncate">{order.restaurant}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{t("mockOrderItems", { count: order.items })}</span>
                          <span className="text-[11px] font-bold">{order.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{t("mockMonthlyGrowth")}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+23%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
                {t("suppliersBadge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                {t("suppliersTitle")}{" "}
                <span className="gradient-text">{t("suppliersTitleHighlight")}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("suppliersBody")}
              </p>
              <ul className="space-y-3">
                {[
                  "suppliersBullet1",
                  "suppliersBullet2",
                  "suppliersBullet3",
                  "suppliersBullet4",
                ].map((itemKey) => (
                  <li key={itemKey} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {t(itemKey)}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                {t("suppliersCta")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSIDE THE BETA ===== */}
      <section id="beta" className="relative py-24 md:py-32 overflow-hidden bg-muted/20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-brand-50)_0%,transparent_55%)] opacity-70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <div className="text-center mb-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                {t("betaBadge")}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                {t("betaTitle")}{" "}
                <span className="gradient-text">{t("betaTitleHighlight")}</span>
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
                {t("betaSubtitle")}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mx-auto mb-14 max-w-3xl grid grid-cols-3 gap-px rounded-2xl border bg-border overflow-hidden">
              {[
                { value: "12", labelKey: "betaStatSeats" },
                { value: "<24h", labelKey: "betaStatResponse" },
                { value: "50%", labelKey: "betaStatDiscount" },
              ].map((stat) => (
                <div key={stat.labelKey} className="bg-card px-4 py-5 text-center">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">{stat.value}</div>
                  <div className="text-[11px] mt-1 uppercase tracking-wider text-muted-foreground font-medium">{t(stat.labelKey)}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Stagger className="grid gap-6 md:grid-cols-3">
            {pilotBenefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <StaggerItem key={b.titleKey}>
                  <HoverLift className="h-full">
                    <div className="group relative h-full rounded-2xl border bg-card p-7 premium-shadow hover:premium-shadow-lg transition-shadow overflow-hidden">
                      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                      <div className="absolute top-5 right-5 text-5xl font-bold text-primary/10 leading-none select-none">0{i + 1}</div>
                      <div className="relative space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{t(b.titleKey)}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{t(b.descKey)}</p>
                      </div>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </Stagger>
          <Reveal delay={0.15}>
            <div className="mt-16 mx-auto max-w-3xl relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-xl opacity-60" />
              <div className="relative rounded-2xl border bg-card p-8 md:p-10 premium-shadow-lg">
                <div className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-lg">N</div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border-2 border-card flex items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">{t("founderBadge")}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {t("founderReplyToday")}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {t("founderMessage")}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t("founderMessage2")}
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                      <a href="mailto:podrska@procure-link.com" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 h-10 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]">
                        <Mail className="h-4 w-4" /> {t("founderCtaEmail")}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {t("founderOrPrefix")} <Link href="/register" className="font-semibold text-primary hover:underline">{t("founderSeatLink")}</Link> {t("founderSeatSuffix")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5 mb-4">
              {t("pricingBadge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("pricingTitle")}{" "}
              <span className="gradient-text">{t("pricingTitleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {t("pricingSubtitle")}
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {t("pricingBetaNote")}
            </span>
          </div>

          <div className="max-w-3xl mx-auto mb-10">
            <div className="rounded-2xl border bg-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("pricingRestaurantsTitle")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("pricingRestaurantsDesc")}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-3xl font-bold tracking-tight">{t("pricingFree")}</div>
                <div className="text-xs text-muted-foreground">{t("pricingForever")}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-3xl mx-auto mb-6">
            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("pricingForSuppliers")}</p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto items-stretch">
            {supplierTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl bg-card p-8 ${
                  tier.highlighted ? "border-2 border-primary premium-shadow-lg" : "border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      {t("pricingMostPopular")}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">{t(tier.taglineKey)}</p>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-bold tracking-tight whitespace-nowrap">{tier.priceRsd}</span>
                    <span className="text-muted-foreground text-sm">/{t("pricingMonthly")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tier.priceEur} / {t("pricingMonthly")}</p>
                </div>
                <ul className="space-y-3 mt-8 flex-1">
                  {tier.featureKeys.map((featKey) => (
                    <li key={featKey} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {t(featKey)}
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
                  {t("ctaJoinBeta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            {t("pricingFootnote")}
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="relative rounded-3xl bg-primary overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
            <div className="relative space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white">
                <Zap className="h-3.5 w-3.5" />
                {t("finalBadge")}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight">
                {t("finalTitle")}
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                {t("finalSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-primary hover:bg-white/90 transition-all active:scale-[0.98] gap-2">
                  {t("ctaJoinBeta")} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:podrska@procure-link.com" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/30 px-8 text-sm font-semibold text-primary-foreground hover:bg-white/10 transition-all active:scale-[0.98] gap-2">
                  <Mail className="h-4 w-4" /> {t("finalCtaTalk")}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("footerTagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("footerProduct")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{t("navFeatures")}</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">{t("navHowItWorks")}</a></li>
                <li><a href="#beta" className="hover:text-foreground transition-colors">{t("footerInsideBeta")}</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">{t("navPricing")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("footerCompany")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="mailto:podrska@procure-link.com" className="hover:text-foreground transition-colors">{t("footerContact")}</a></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">{t("ctaJoinBeta")}</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">{t("navSignIn")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("footerLegal")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">{t("footerPrivacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">{t("footerTerms")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ProcureLink. {t("footerRights")}
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
