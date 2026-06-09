export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProductList } from "@/components/supplier/product-list";

export default async function ProductsPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("supplier_id", profile!.company_id!)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const serializedProducts = JSON.parse(JSON.stringify(products ?? []));
  const serializedCategories = JSON.parse(JSON.stringify(categories ?? []));

  return (
    <div className="space-y-6">
      <PageHeader title={t("productsTitle")} description={t("productsDesc")} />
      <ProductList
        products={serializedProducts}
        categories={serializedCategories}
        currency={currency}
      />
    </div>
  );
}
