import Link from "next/link";
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
  {
    icon: ShoppingCart,
    title: "Jedna korpa, svi dobavljači",
    description:
      "Dodajte proizvode od bilo kog dobavljača u vašoj mreži. Jedno plaćanje - mi ga delimo na prave porudžbine u pozadini.",
  },
  {
    icon: Repeat,
    title: "Automatizujte ponavljajuće porudžbine",
    description:
      "Losos svakog utorka, začini svakog četvrtka. Podesite jednom i porudžbine se same šalju po rasporedu.",
  },
  {
    icon: CalendarDays,
    title: "Isporuka koju vidite",
    description:
      "Mesečni kalendar svih dolazećih isporuka. Vaša kuhinja zna šta stiže i kada, na prvi pogled.",
  },
  {
    icon: Truck,
    title: "Poručivanje prema terminima",
    description:
      "Svaki dobavljač objavljuje termine isporuke. Aplikacija blokira datume koje ne mogu da ispune - nema više porudžbina koje tiho ne stignu.",
  },
  {
    icon: Shield,
    title: "Potpuna evidencija",
    description:
      "Svaka promena statusa, plaćanja i otkazivanja - sa vremenskom oznakom i vidljiva obema stranama. Nema više 'ko je šta rekao'.",
  },
  {
    icon: Globe,
    title: "RSD i EUR",
    description:
      "Cene u dinarima ili evrima - porudžbina poštuje valutu dobavljača od kog kupujete.",
  },
];

const steps = [
  {
    step: "01",
    title: "Pregledajte katalog",
    description:
      "Proizvodi svih povezanih dobavljača na jednom mestu. Filtrirajte po kategoriji. Uporedite cene jednu pored druge.",
  },
  {
    step: "02",
    title: "Plaćanje jednom",
    description:
      "Dodajte sve u jednu korpu - čak i od pet dobavljača. Izaberite datum isporuke. Potvrdite. Mi delimo porudžbine.",
  },
  {
    step: "03",
    title: "Pratite i primajte",
    description:
      "Pratite svaku porudžbinu kroz statuse: na čekanju, potvrđeno, poslato, isporučeno. Označite probleme čim nastanu.",
  },
  {
    step: "04",
    title: "Automatizujte ono što se ponavlja",
    description:
      "Pretvorite bilo koju korpu u ponavljajuću porudžbinu. Nedeljno, dvonedeljno, mesečno. Menjajte i pauzirajte bilo kada.",
  },
];

const betaPromises = [
  { icon: Sparkles, label: "Besplatno tokom bete" },
  { icon: Clock, label: "Podešavanje za 5 minuta" },
  { icon: Shield, label: "Infrastruktura u EU" },
  { icon: Lock, label: "Bez kartice" },
];

const pilotBenefits = [
  {
    icon: MessageCircle,
    title: "Direktna linija sa osnivačem",
    description:
      "Na vaše poruke odgovaramo istog dana. Tim je mali i možete razgovarati direktno sa nama.",
  },
  {
    icon: Map,
    title: "Oblikujte razvoj proizvoda",
    description:
      "Funkcije koje sledeće gradimo su one koje članovi pilota traže. Ne čekate u redu iza velikih klijenata.",
  },
  {
    icon: Lock,
    title: "Zaključana cena za rane korisnike",
    description:
      "Koliko god naplaćivali posle bete, članovi pilota dobijaju 50% popusta zauvek. Bez iznenađenja na računu.",
  },
];

// Aligned with src/lib/plans.ts and docs/sql/007_subscriptions.sql.
const supplierTiers = [
  {
    name: "Basic",
    priceRsd: "2.900 RSD",
    priceEur: "25 EUR",
    tagline: "Za dobavljače koji počinju da primaju porudžbine.",
    features: [
      "Neograničen katalog proizvoda",
      "Prijem i obrada porudžbina",
      "Termini isporuke i kalendar",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    priceRsd: "5.900 RSD",
    priceEur: "49 EUR",
    tagline: "Za dobavljače sa ozbiljnim obimom porudžbina.",
    features: [
      "Sve iz Basic plana",
      "Direktna podrška osnivača",
      "Napredni izveštaji",
      "Verifikovan dobavljač - oznaka",
    ],
    highlighted: true,
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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mogućnosti</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kako funkcioniše</a>
            <a href="#beta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beta</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cene</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Prijava
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Pridruži se beti
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
                Privatna beta - prva grupa je otvorena
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                Snabdevanje restorana,{" "}
                <span className="gradient-text">pojednostavljeno</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Jedno mesto za sve dobavljače. Pregledajte kataloge, poručujte od više dobavljača u jednom plaćanju i automatizujte ono što se ponavlja. Napravljeno za kuhinje umorne od telefonskih poziva i tabela.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] gap-2"
                >
                  Pridruži se beti
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-border bg-background px-8 text-sm font-semibold hover:bg-muted transition-all active:scale-[0.98]"
                >
                  Pogledaj kako radi
                </a>
              </div>
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
                PROBLEM
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                Nabavka u restoranima i dalje radi preko{" "}
                <span className="gradient-text">Vibera i PDF-ova</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Većina kuhinja radi sa 6 do 12 dobavljača. Svaki traži porudžbine u svom formatu - Viber, imejl, PDF, poziv pre 21h.
              </p>
              <p>
                Greške se kriju u tom haosu. Propušten utorak. Dupla naplata koju niko ne primeti do dana fakturisanja. Termin isporuke koji dobavljač nikada nije potvrdio.
              </p>
              <p className="text-foreground font-medium">
                ProcureLink zamenjuje haos jednim tokom rada koji obe strane vide.
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
                ŠTA DOBIJATE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ceo tok nabavke,{" "}
                <span className="gradient-text">u jednom proizvodu</span>
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Nije samo alat za oglašavanje. Nije obična porudžbenica. Ceo krug od pronalaska do isporuke do ponavljanja.
              </p>
            </div>
          </Reveal>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <HoverLift className="h-full">
                    <div className="group relative h-full rounded-2xl border bg-card p-7 premium-shadow hover:premium-shadow-lg transition-shadow">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
                KAKO FUNKCIONIŠE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
                Od registracije do prve porudžbine za{" "}
                <span className="gradient-text">manje od 10 minuta</span>
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
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{step.description}</p>
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
                ZA RESTORANE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Prestanite da jurite dobavljače.{" "}
                <span className="gradient-text">Vodite nabavku kao tok rada.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Pregledajte proizvode svih dobavljača sa kojima radite. Uporedite na prvi pogled. Poručite od petoro odjednom i izaberite dan isporuke za svakog. Podesite da se losos, hleb i mlečni proizvodi ponavljaju po pravom rasporedu i prestanite da brinete o njima.
              </p>
              <ul className="space-y-3">
                {[
                  "Katalozi svih dobavljača u vašoj mreži",
                  "Jedna korpa za više dobavljača, jedno plaćanje",
                  "Ponavljajuće porudžbine dnevno, nedeljno ili mesečno",
                  "Kalendar isporuka prikazuje svaku dolazeću porudžbinu",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Pridruži se beti kao restoran <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border">
              <div className="rounded-xl bg-card premium-shadow-lg overflow-hidden border">
                <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-muted-foreground ml-2">Pregled proizvoda</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Pretraži povrće, mlečne proizvode, meso...</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Paradajz", price: "280", unit: "kg", color: "bg-red-100" },
                      { name: "Maslinovo ulje", price: "1.450", unit: "l", color: "bg-amber-100" },
                      { name: "Mocarela", price: "1.040", unit: "kg", color: "bg-blue-50" },
                    ].map((p) => (
                      <div key={p.name} className="rounded-lg border p-3 space-y-2 hover:border-primary/30 transition-colors">
                        <div className={`h-14 ${p.color} rounded flex items-center justify-center`}>
                          <ShoppingCart className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-[11px] font-medium truncate">{p.name}</p>
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
                      <span className="text-xs font-medium">3 stavke u korpi</span>
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
                  <span className="text-[10px] text-muted-foreground ml-2">Kontrolna tabla dobavljača</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Porudžbine", value: "128", icon: Package, trend: "+12%" },
                      { label: "Prihod", value: "1,4M RSD", icon: CreditCard, trend: "+8%" },
                      { label: "Klijenti", value: "47", icon: Users, trend: "+5" },
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
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Nedavne porudžbine</p>
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
                          <span className="text-[10px] text-muted-foreground">{order.items} stavki</span>
                          <span className="text-[11px] font-bold">{order.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Mesečni rast</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+23%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
                ZA DOBAVLJAČE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Izlog koji{" "}
                <span className="gradient-text">vodi administraciju umesto vas</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Postavite proizvode. Odredite termine isporuke po zoni i danu. Restorani vas pronalaze, poručuju, a vi ih vodite od čekanja do isporuke u jednom prikazu. Stalni kupci ponavljaju porudžbine po rasporedu koji nikada ne morate da jurite.
              </p>
              <ul className="space-y-3">
                {[
                  "Neograničen broj proizvoda sa kategorijama",
                  "Vremenski ograničene akcije i promocije",
                  "Termini isporuke po zoni, danu i kapacitetu",
                  "Praćenje statusa plaćanja sa potpunom evidencijom",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Pridruži se beti kao dobavljač <ChevronRight className="h-4 w-4" />
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
                UNUTAR BETE
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                Šta dobijate jer ste{" "}
                <span className="gradient-text">rani</span>
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
                Ne pretvaramo se da smo veći nego što jesmo. Evo iskrene ponude za članove pilota.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mx-auto mb-14 max-w-3xl grid grid-cols-3 gap-px rounded-2xl border bg-border overflow-hidden">
              {[
                { value: "12", label: "Pilot mesta" },
                { value: "<24h", label: "Odgovor osnivača" },
                { value: "50%", label: "Popust zauvek" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card px-4 py-5 text-center">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">{stat.value}</div>
                  <div className="text-[11px] mt-1 uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Stagger className="grid gap-6 md:grid-cols-3">
            {pilotBenefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <StaggerItem key={b.title}>
                  <HoverLift className="h-full">
                    <div className="group relative h-full rounded-2xl border bg-card p-7 premium-shadow hover:premium-shadow-lg transition-shadow overflow-hidden">
                      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                      <div className="absolute top-5 right-5 text-5xl font-bold text-primary/10 leading-none select-none">0{i + 1}</div>
                      <div className="relative space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{b.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
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
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Poruka osnivača</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Odgovaramo danas
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      Gradimo ovo sa malom grupom jer je jedini način da se nabavka uradi kako treba taj da sedimo pored ljudi koji to rade svakog dana. Ako se pridružite beti, očekujte imejlove, pozive i povremeno pitanje &quot;da li bi ovo bilo korisno?&quot; pre nego što nešto objavimo.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Zauzvrat, dobijate proizvod oblikovan oko vaše kuhinje - a ne po tuđoj ideji.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                      <a href="mailto:podrska@procure-link.com" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 h-10 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]">
                        <Mail className="h-4 w-4" /> Pišite osnivaču
                      </a>
                      <span className="text-xs text-muted-foreground">
                        Ili <Link href="/register" className="font-semibold text-primary hover:underline">uzmite pilot mesto</Link> - traje 5 minuta.
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
              CENE
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Besplatno tokom bete.{" "}
              <span className="gradient-text">Iskreno posle.</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Restorani poručuju besplatno, zauvek. Dobavljači plaćaju jednostavnu mesečnu softversku naknadu. Članovi pilota zaključavaju 50% popusta zauvek.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Tokom bete je sve besplatno. Cene ispod su okvirne i važe posle lansiranja.
            </span>
          </div>

          <div className="max-w-3xl mx-auto mb-10">
            <div className="rounded-2xl border bg-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Restorani</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Poručujte od svih dobavljača, zakazujte isporuke, automatizujte ponavljajuće porudžbine. Uvek besplatno.
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-3xl font-bold tracking-tight">Besplatno</div>
                <div className="text-xs text-muted-foreground">zauvek</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-3xl mx-auto mb-6">
            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Za dobavljače</p>
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
                      Najpopularniji
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">{tier.tagline}</p>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-bold tracking-tight whitespace-nowrap">{tier.priceRsd}</span>
                    <span className="text-muted-foreground text-sm">/mesečno</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tier.priceEur} / mesečno</p>
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
                  Pridruži se beti
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Naplaćujemo isključivo softversku naknadu - bez provizije po transakciji. Zainteresovani dobavljači nam se jave i mi ih ručno aktiviramo tokom bete.
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
                Ograničen broj beta mesta
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight">
                Spremni da vodite nabavku kao tok rada?
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                Pet minuta za podešavanje. Besplatno dok traje beta. Pravi proizvod, pravi osnivač, pravi razgovor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-primary hover:bg-white/90 transition-all active:scale-[0.98] gap-2">
                  Pridruži se beti <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:podrska@procure-link.com" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/30 px-8 text-sm font-semibold text-primary-foreground hover:bg-white/10 transition-all active:scale-[0.98] gap-2">
                  <Mail className="h-4 w-4" /> Razgovaraj sa osnivačem
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
                Nabavka za restorane bez telefonskih poziva. Trenutno u privatnoj beti.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Proizvod</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Mogućnosti</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Kako funkcioniše</a></li>
                <li><a href="#beta" className="hover:text-foreground transition-colors">Unutar bete</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Cene</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Kompanija</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="mailto:podrska@procure-link.com" className="hover:text-foreground transition-colors">Kontakt</a></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Pridruži se beti</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Prijava</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Pravno</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Politika privatnosti</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Uslovi korišćenja</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ProcureLink. Sva prava zadržana.
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
