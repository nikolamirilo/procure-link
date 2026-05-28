export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringOrderList } from "@/components/restaurant/recurring-order-list";

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  // Fetch recurring orders with supplier name and item count
  const { data: rawOrders } = await supabase
    .from("recurring_orders")
    .select(
      "id, name, frequency, schedule_days, delivery_offset_days, is_active, next_run_at, supplier_id, companies!recurring_orders_supplier_id_fkey(name)"
    )
    .eq("restaurant_id", profile!.company_id!)
    .order("created_at", { ascending: false });

  // Fetch item counts
  const { data: itemCounts } = await supabase
    .from("recurring_order_items")
    .select("recurring_order_id");

  const countMap: Record<string, number> = {};
  for (const ic of itemCounts ?? []) {
    countMap[ic.recurring_order_id] = (countMap[ic.recurring_order_id] ?? 0) + 1;
  }

  const orders = (rawOrders ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    frequency: o.frequency,
    schedule_days: o.schedule_days,
    delivery_offset_days: o.delivery_offset_days,
    is_active: o.is_active,
    next_run_at: o.next_run_at,
    supplier_name: (o.companies as { name: string } | null)?.name ?? "Unknown",
    item_count: countMap[o.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Set up recurring orders that are placed automatically"
        action={
          <Link
            href="/restaurant/automations/new"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            + New Automation
          </Link>
        }
      />
      <RecurringOrderList orders={orders} />
    </div>
  );
}
