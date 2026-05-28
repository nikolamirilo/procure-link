"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyType } from "@/lib/supabase/types";
import { Building2, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const companyTypes = [
  {
    value: "restaurant" as CompanyType,
    label: "Restaurant",
    description: "Order supplies for your restaurant",
    icon: UtensilsCrossed,
  },
  {
    value: "supplier" as CompanyType,
    label: "Supplier",
    description: "Sell products to restaurants",
    icon: Building2,
  },
];

export default function RegisterPage() {
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
          <h2 className="text-3xl font-bold text-white">Join ProcureLink</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Create your account and start streamlining your supply chain today.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose your role and get started
            </p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {/* Company type selector */}
            <div className="space-y-2">
              <Label>I am a</Label>
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
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" placeholder="John Doe" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min 6 characters" className="h-11" minLength={6} required />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
