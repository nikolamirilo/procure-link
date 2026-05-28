"use client";

import { useState, useEffect } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { value: "EUR", label: "EUR (Euro)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "GBP", label: "GBP (British Pound)" },
  { value: "RSD", label: "RSD (Serbian Dinar)" },
  { value: "CHF", label: "CHF (Swiss Franc)" },
  { value: "CAD", label: "CAD (Canadian Dollar)" },
  { value: "AUD", label: "AUD (Australian Dollar)" },
];

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [currency, setCurrency] = useState("EUR");

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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("currency", currency);
    const result = await completeOnboarding(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Set Up Your {isSupplier ? "Supply" : "Restaurant"} Profile
          </CardTitle>
          <CardDescription>
            Tell us about your {isSupplier ? "business" : "restaurant"} to get
            started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {isSupplier ? "Company" : "Restaurant"} Name
              </Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder={
                  isSupplier ? "Fresh Foods Co." : "La Bella Italia"
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="123 Main St" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Belgrade" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="11000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" placeholder="Serbia" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+381..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Business Email</Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  placeholder="info@company.com"
                />
              </div>
            </div>
            {isSupplier && (
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
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
              </div>
            )}
            {!isSupplier && (
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Type</Label>
                <Input
                  id="cuisineType"
                  name="cuisineType"
                  placeholder="Italian, Serbian, Asian..."
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
