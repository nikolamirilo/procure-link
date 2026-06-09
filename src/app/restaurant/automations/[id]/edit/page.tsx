export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringOrderForm } from "@/components/restaurant/recurring-order-form";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAutomationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("pageHeaders");

  const { data: order } = await supabase
    .from("recurring_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) return notFound();

  const { data: items } = await supabase
    .from("recurring_order_items")
    .select("product_id, product_name, unit, unit_price, quantity")
    .eq("recurring_order_id", id);

  const { data: suppliers } = await supabase
    .from("companies")
    .select("id, name")
    .eq("type", "supplier")
    .order("name");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, price, min_order_qty, supplier_id")
    .eq("is_available", true)
    .order("name");

  const scheduleDays = Array.isArray(order.schedule_days)
    ? (order.schedule_days as number[])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("editAutomationTitle")} description={order.name} />
      <RecurringOrderForm
        suppliers={suppliers ?? []}
        products={products ?? []}
        existingOrder={{
          id: order.id,
          name: order.name,
          supplier_id: order.supplier_id,
          frequency: order.frequency,
          schedule_days: scheduleDays,
          delivery_offset_days: order.delivery_offset_days,
          start_date: order.start_date,
          end_date: order.end_date,
          notes: order.notes,
          items: (items ?? []).map((i) => ({
            productId: i.product_id,
            productName: i.product_name,
            unit: i.unit,
            unitPrice: i.unit_price,
            quantity: i.quantity,
          })),
        }}
      />
    </div>
  );
}
