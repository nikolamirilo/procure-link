export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { OfferList } from "@/components/supplier/offer-list";

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user!.id)
    .single();

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
      <PageHeader
        title="Offers"
        description="Manage discounts and promotions on your products"
      />
      <OfferList offers={offers ?? []} products={products ?? []} />
    </div>
  );
}
