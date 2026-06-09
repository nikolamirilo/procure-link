export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthContext } from "@/lib/actions/_auth";
import { PageHeader } from "@/components/shared/page-header";
import { CompanySettingsForm } from "@/components/shared/company-settings-form";

export default async function RestaurantSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const t = await getTranslations("settings");

  const { data: company } = await ctx.supabase
    .from("companies")
    .select("*")
    .eq("id", ctx.companyId)
    .single();
  if (!company) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <CompanySettingsForm company={company} role="restaurant" />
    </div>
  );
}
