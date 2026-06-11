export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { OfferList } from "@/components/supplier/offer-list";
import { FEATURES } from "@/lib/features";

export default async function OffersPage() {
  // Hidden until restaurants can actually see and benefit from offers
  // (browse badges + checkout pricing). See docs/ux-improvement-proposal.md 3.4.
  if (!FEATURES.offers) redirect("/supplier/dashboard");

  const supabase = await createClient();
  const t = await getTranslations("pageHeaders");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, companies!profiles_company_id_fkey(currency)")
    .eq("id", user!.id)
    .single();

  const currency =
    (profile?.companies as unknown as { currency?: string } | null)?.currency ?? "RSD";

  const { data: offers } = await supabase
    .from("offers")
    .select("*, products(id, name, price, supplier_id)")
    .eq("products.supplier_id", profile!.company_id!)
    .order("created_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("supplier_id", profile!.company_id!)
    .eq("is_available", true)
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title={t("offersTitle")} description={t("offersDesc")} />
      <OfferList offers={offers ?? []} products={products ?? []} currency={currency} />
    </div>
  );
}
