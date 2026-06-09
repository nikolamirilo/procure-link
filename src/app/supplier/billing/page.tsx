export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getAuthContext } from "@/lib/actions/_auth";
import { PageHeader } from "@/components/shared/page-header";
import { PlanCards } from "@/components/supplier/plan-cards";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";

const STATUS_KEY: Record<string, string> = {
  trialing: "statusTrialing",
  active: "statusActive",
  past_due: "statusPastDue",
  canceled: "statusCanceled",
};

export default async function SupplierBillingPage() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "supplier") redirect("/login");
  const t = await getTranslations("billing");
  const locale = (await getLocale()) as Locale;

  const { data: sub } = await ctx.supabase
    .from("supplier_subscriptions")
    .select("plan_code, status, trial_ends_at")
    .eq("company_id", ctx.companyId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="rounded-xl border bg-card p-5 max-w-2xl space-y-2">
        {sub ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("currentPlan")}</span>
              <span className="font-semibold capitalize">{sub.plan_code ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("status")}</span>
              <span className="font-medium">{t(STATUS_KEY[sub.status] ?? "statusTrialing")}</span>
            </div>
            {sub.trial_ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("trialEnds")}</span>
                <span className="font-medium">{formatDay(sub.trial_ends_at, "d. MMM yyyy.", locale)}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold">{t("noPlan")}</p>
            <p className="text-sm text-muted-foreground">{t("noPlanBody")}</p>
          </>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t("choosePlan")}</h2>
        <PlanCards />
        <p className="text-xs text-muted-foreground mt-4 max-w-2xl">{t("softwareFeeNote")}</p>
      </div>
    </div>
  );
}
