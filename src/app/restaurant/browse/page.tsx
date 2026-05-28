export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProductBrowser } from "@/components/restaurant/product-browser";

export default async function BrowsePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      "*, categories(name), companies!products_supplier_id_fkey(name, slug)"
    )
    .eq("is_available", true)
    .order("name");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: suppliers } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("type", "supplier")
    .order("name");

  // Serialize to strip non-serializable Supabase metadata before passing to client
  const serializedProducts = JSON.parse(JSON.stringify(products ?? []));
  const serializedCategories = JSON.parse(JSON.stringify(categories ?? []));
  const serializedSuppliers = JSON.parse(JSON.stringify(suppliers ?? []));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse Products"
        description="Find products from suppliers"
      />
      <ProductBrowser
        products={serializedProducts}
        categories={serializedCategories}
        suppliers={serializedSuppliers}
      />
    </div>
  );
}
