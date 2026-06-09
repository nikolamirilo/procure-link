"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyType } from "@/lib/supabase/types";
import { Building2, UtensilsCrossed, Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const companyTypes = [
  { value: "restaurant" as CompanyType, labelKey: "restaurant", descKey: "restaurantDesc", icon: UtensilsCrossed },
  { value: "supplier" as CompanyType, labelKey: "supplier", descKey: "supplierDesc", icon: Building2 },
];

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [companyType, setCompanyType] = useState<CompanyType>("restaurant");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("companyType", companyType);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: gradient panel */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="relative text-center space-y-4 px-12 max-w-md">
          <Logo size="xl" showText={false} variant="light" className="justify-center" />
          <h2 className="text-3xl font-bold text-white">{t("joinTitle")}</h2>
          <p className="text-white/70 text-lg leading-relaxed">{t("joinBody")}</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t("signUpTitle")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("createSub")}</p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {/* Company type selector */}
            <div className="space-y-2">
              <Label>{t("iAm")}</Label>
              <div className="grid gap-2">
                {companyTypes.map((r) => {
                  const Icon = r.icon;
                  const selected = companyType === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setCompanyType(r.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t(r.labelKey)}</p>
                        <p className="text-xs text-muted-foreground">{t(r.descKey)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input id="fullName" name="fullName" placeholder={t("fullNamePlaceholder")} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")} className="h-11" minLength={8} required />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.rich("privacyNotice", {
                terms: (chunks) => (
                  <Link href="/terms" className="text-primary hover:underline">{chunks}</Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="text-primary hover:underline">{chunks}</Link>
                ),
              })}
            </p>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("creatingAccount") : t("signUpCta")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("signInCta")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
