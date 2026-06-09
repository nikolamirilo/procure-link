export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringOrderForm } from "@/components/restaurant/recurring-order-form";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function NewAutomationPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations("pageHeaders");

  // Fetch suppliers
  const { data: suppliers } = await supabase
    .from("companies")
    .select("id, name")
    .eq("type", "supplier")
    .order("name");

  // Fetch available products for the product picker
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, price, min_order_qty, supplier_id")
    .eq("is_available", true)
    .order("name");

  // Parse initial items from cart (if provided via URL)
  let initialItems: {
    productId: string;
    productName: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    supplierId: string;
    supplierName: string;
  }[] | undefined;

  if (params.data) {
    try {
      initialItems = JSON.parse(decodeURIComponent(params.data));
    } catch {
      // Invalid data, ignore
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("newAutomationTitle")} description={t("newAutomationDesc")} />
      <RecurringOrderForm
        suppliers={suppliers ?? []}
        products={products ?? []}
        initialItems={initialItems}
      />
    </div>
  );
}
