export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringOrderForm } from "@/components/restaurant/recurring-order-form";

interface Props {
  // data: [{productId, quantity}] from the cart's "Save as recurring".
  // supplier: locks the supplier; date: chosen delivery date, used to suggest
  // a weekly schedule that lands deliveries on that same weekday.
  searchParams: Promise<{ data?: string; supplier?: string; date?: string }>;
}

const DEFAULT_OFFSET_DAYS = 2;

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

  // Enrich minimal {productId, quantity} pairs from the catalog. The URL only
  // carries ids - names and prices always come from the database.
  let initialItems:
    | {
        productId: string;
        productName: string;
        unit: string;
        unitPrice: number;
        quantity: number;
        supplierId: string;
        supplierName: string;
      }[]
    | undefined;

  if (params.data) {
    try {
      const raw = JSON.parse(decodeURIComponent(params.data)) as {
        productId: string;
        quantity: number;
      }[];
      const byId = new Map((products ?? []).map((p) => [p.id, p]));
      const supplierName = (id: string) =>
        suppliers?.find((s) => s.id === id)?.name ?? "";
      initialItems = raw.flatMap((r) => {
        const p = byId.get(r.productId);
        if (!p) return [];
        if (params.supplier && p.supplier_id !== params.supplier) return [];
        return [
          {
            productId: p.id,
            productName: p.name,
            unit: p.unit,
            unitPrice: Number(p.price),
            quantity: Number(r.quantity) || p.min_order_qty || 1,
            supplierId: p.supplier_id,
            supplierName: supplierName(p.supplier_id),
          },
        ];
      });
      if (initialItems.length === 0) initialItems = undefined;
    } catch {
      // Invalid data, ignore
    }
  }

  // Suggest a weekly schedule from the cart's delivery date: place the order
  // `offset` days earlier so deliveries keep landing on the chosen weekday.
  let defaultScheduleDays: number[] | undefined;
  if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    const d = new Date(`${params.date}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      d.setDate(d.getDate() - DEFAULT_OFFSET_DAYS);
      defaultScheduleDays = [((d.getDay() + 6) % 7) + 1];
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("newAutomationTitle")} description={t("newAutomationDesc")} />
      <RecurringOrderForm
        suppliers={suppliers ?? []}
        products={products ?? []}
        initialItems={initialItems}
        initialSupplierIdOverride={params.supplier}
        defaultScheduleDays={defaultScheduleDays}
      />
    </div>
  );
}
