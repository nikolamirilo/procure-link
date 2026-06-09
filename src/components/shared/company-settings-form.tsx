"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateCompanySettings, deleteAccount } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CuisineSelect } from "@/components/shared/cuisine-select";
import { Loader2, Trash2 } from "lucide-react";

interface Company {
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  cuisine_type: string | null;
  currency: string | null;
  lead_time_hours: number | null;
  min_order_value: number | null;
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function CompanySettingsForm({
  company,
  role,
}: {
  company: Company;
  role: "supplier" | "restaurant";
}) {
  const t = useTranslations("settings");
  const to = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await updateCompanySettings(formData);
    if (result?.error) setError(result.error);
    else toast.success(t("saved"));
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <form action={handle} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("companyInfo")}
          </h2>
          <Field id="name" label={to("companyName")} defaultValue={company.name} required />
          <Field id="description" label={tc("optional")} defaultValue={company.description ?? ""} textarea />
          {role === "restaurant" && (
            <div className="space-y-2">
              <Label htmlFor="cuisineType">{to("cuisineType")}</Label>
              <CuisineSelect name="cuisineType" defaultValue={company.cuisine_type ?? ""} />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("contactInfo")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="phone" label={to("phone")} defaultValue={company.phone ?? ""} />
            <Field id="email" label={to("companyEmail")} type="email" defaultValue={company.email ?? ""} />
            <Field id="address" label={to("address")} defaultValue={company.address ?? ""} />
            <Field id="city" label={to("city")} defaultValue={company.city ?? ""} />
            <Field id="postalCode" label={to("postalCode")} defaultValue={company.postal_code ?? ""} />
            <Field id="country" label={to("country")} defaultValue={company.country ?? ""} />
          </div>
        </section>

        {role === "supplier" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t("businessInfo")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">{to("currency")}</Label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={company.currency ?? "RSD"}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="RSD">RSD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <Field id="leadTimeHours" label={t("leadTimeHours")} type="number" defaultValue={String(company.lead_time_hours ?? "")} />
              <Field id="minOrderValue" label={t("minOrderValue")} type="number" defaultValue={String(company.min_order_value ?? "")} />
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <SaveButton label={tc("save")} />
      </form>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-destructive">
          {t("dangerZone")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("deleteAccountBody")}</p>
        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t("deleteAccount")}
            </Button>
          }
          title={t("deleteAccount")}
          description={t("deleteAccountConfirm")}
          confirmLabel={t("deleteAccount")}
          variant="destructive"
          onConfirm={async () => {
            const result = await deleteAccount();
            if (result?.error) toast.error(result.error);
          }}
        />
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
  required,
  textarea,
}: {
  id: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} name={id} defaultValue={defaultValue} rows={3} />
      ) : (
        <Input id={id} name={id} type={type} defaultValue={defaultValue} required={required} />
      )}
    </div>
  );
}
