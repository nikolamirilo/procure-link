"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { completeOnboarding } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/logo";
import { CuisineSelect } from "@/components/shared/cuisine-select";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Phone,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

const CURRENCIES = [
  { value: "RSD", label: "RSD (Srpski dinar)" },
  { value: "EUR", label: "EUR (Euro)" },
];

type StepKey = "basics" | "location" | "contact";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [currency, setCurrency] = useState("RSD");
  const [step, setStep] = useState<StepKey>("basics");

  // form state - persist between step transitions
  const [values, setValues] = useState({
    companyName: "",
    cuisineType: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
    companyEmail: "",
  });

  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsSupplier(user.user_metadata?.company_type === "supplier");
      }
    }
    checkRole();
  }, []);

  const steps: { key: StepKey; label: string; icon: typeof Building2 }[] = [
    { key: "basics", label: t("stepBasics"), icon: isSupplier ? Building2 : UtensilsCrossed },
    { key: "location", label: t("stepLocation"), icon: MapPin },
    { key: "contact", label: t("stepContact"), icon: Phone },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  function updateField<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === "basics") return values.companyName.trim().length > 0;
    return true;
  }

  function next() {
    if (!canAdvance()) return;
    const idx = currentStepIndex;
    if (idx < steps.length - 1) setStep(steps[idx + 1].key);
  }

  function back() {
    const idx = currentStepIndex;
    if (idx > 0) setStep(steps[idx - 1].key);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => formData.set(k, v));
    formData.set("currency", currency);

    const result = await completeOnboarding(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: gradient panel with progress */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
        <div className="relative flex flex-col justify-between p-12 w-full max-w-md mx-auto">
          <div>
            <Logo size="md" variant="light" />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3" />
                {t("finalStep")}
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                {isSupplier ? t("setupBusiness") : t("setupRestaurant")}
              </h2>
              <p className="text-white/70 leading-relaxed">{t("setupBlurb")}</p>
            </div>

            {/* Vertical stepper */}
            <ol className="space-y-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <li
                    key={s.key}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                      active && "bg-white/15 backdrop-blur-sm",
                      !active && "opacity-70"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                        done
                          ? "bg-white text-primary"
                          : active
                          ? "bg-white/25 text-white ring-2 ring-white/40"
                          : "bg-white/10 text-white/70"
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/60 font-medium">
                        {t("step")} {i + 1}
                      </p>
                      <p className="text-sm font-semibold text-white">{s.label}</p>
                    </div>
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="text-xs text-white/50">{t("dataPrivate")}</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 bg-muted/20">
        <div className="w-full max-w-xl">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo />
          </div>

          {/* Mobile horizontal stepper */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div
                  key={s.key}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    i <= currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t("step")} {currentStepIndex + 1} {t("of")} {steps.length} - {steps[currentStepIndex].label}
            </p>
          </div>

          <div className="rounded-2xl border bg-card premium-shadow-lg p-6 sm:p-8">
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                {isSupplier ? t("profileTitleSupplier") : t("profileTitleRestaurant")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === "basics" &&
                  (isSupplier ? t("descBasicsSupplier") : t("descBasicsRestaurant"))}
                {step === "location" && t("descLocation")}
                {step === "contact" && t("descContact")}
              </p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* Step 1: Basics */}
              {step === "basics" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      {isSupplier ? t("companyLabel") : t("restaurantLabel")}
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder={
                        isSupplier ? "Fresh Foods Co." : "La Bella Italia"
                      }
                      value={values.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  {isSupplier ? (
                    <div className="space-y-2">
                      <Label>{t("defaultCurrency")}</Label>
                      <Select
                        value={currency}
                        onValueChange={(v) => v && setCurrency(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t("currencyHelp")}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="cuisineType">{t("cuisineType")}</Label>
                      <CuisineSelect
                        defaultValue={values.cuisineType}
                        onChange={(v) => updateField("cuisineType", v)}
                      />
                      <p className="text-xs text-muted-foreground">{t("cuisineHelp")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Location */}
              {step === "location" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="address">{t("streetAddress")}</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main St"
                      value={values.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("city")}</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Belgrade"
                        value={values.city}
                        onChange={(e) => updateField("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">{t("postalCode")}</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="11000"
                        value={values.postalCode}
                        onChange={(e) => updateField("postalCode", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{t("country")}</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Serbia"
                      value={values.country}
                      onChange={(e) => updateField("country", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {step === "contact" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phoneNumber")}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+381..."
                      value={values.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">{t("companyEmail")}</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      type="email"
                      placeholder="info@kompanija.com"
                      value={values.companyEmail}
                      onChange={(e) => updateField("companyEmail", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t("emailHelp")}</p>
                  </div>

                  {/* Review summary */}
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("almostDone")}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">{values.companyName || "-"}</span>
                      {values.city && (
                        <span className="text-muted-foreground"> {t("in")} {values.city}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Nav */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={back}
                  disabled={currentStepIndex === 0 || loading}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("back")}
                </Button>

                {currentStepIndex < steps.length - 1 ? (
                  <Button
                    key="continue-btn"
                    type="button"
                    onClick={next}
                    disabled={!canAdvance()}
                    className="gap-2 min-w-[140px]"
                  >
                    {t("continue")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    key="submit-btn"
                    type="submit"
                    disabled={loading}
                    className="gap-2 min-w-[160px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("settingUp")}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t("completeSetup")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">{t("skipNote")}</p>
        </div>
      </div>
    </div>
  );
}
