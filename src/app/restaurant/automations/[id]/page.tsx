export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { RecurringOrderDetail } from "@/components/restaurant/recurring-order-detail";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AutomationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the recurring order
  const { data: order } = await supabase
    .from("recurring_orders")
    .select(
      "*, companies!recurring_orders_supplier_id_fkey(name)"
    )
    .eq("id", id)
    .single();

  if (!order) return notFound();

  // Fetch items
  const { data: items } = await supabase
    .from("recurring_order_items")
    .select("id, product_name, quantity, unit, unit_price")
    .eq("recurring_order_id", id);

  // Fetch recent runs with order numbers
  const { data: rawRuns } = await supabase
    .from("recurring_order_runs")
    .select("id, status, error_message, run_at, order_id")
    .eq("recurring_order_id", id)
    .order("run_at", { ascending: false })
    .limit(20);

  // Get order numbers for successful runs
  const orderIds = (rawRuns ?? [])
    .filter((r) => r.order_id)
    .map((r) => r.order_id!);

  let orderNumbers: Record<string, string> = {};
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number")
      .in("id", orderIds);
    orderNumbers = (orders ?? []).reduce(
      (acc, o) => ({ ...acc, [o.id]: o.order_number }),
      {} as Record<string, string>
    );
  }

  const runs = (rawRuns ?? []).map((r) => ({
    ...r,
    order_number: r.order_id ? orderNumbers[r.order_id] ?? null : null,
  }));

  const scheduleDays = Array.isArray(order.schedule_days)
    ? (order.schedule_days as number[])
    : [];

  return (
    <RecurringOrderDetail
      order={{
        id: order.id,
        name: order.name,
        frequency: order.frequency,
        schedule_days: scheduleDays,
        delivery_offset_days: order.delivery_offset_days,
        is_active: order.is_active,
        start_date: order.start_date,
        end_date: order.end_date,
        notes: order.notes,
        next_run_at: order.next_run_at,
        last_run_at: order.last_run_at,
        created_at: order.created_at,
        supplier_name: (order.companies as { name: string } | null)?.name ?? "Unknown",
        items: items ?? [],
        runs,
      }}
    />
  );
}
