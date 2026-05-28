export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { DeliveryCalendar } from "@/components/restaurant/delivery-calendar";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  // Fetch upcoming orders for the next 30 days
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, delivery_date, total, currency, notes, supplier:companies!orders_supplier_id_fkey(name), order_items(id, product_name, quantity, unit, unit_price, total_price)")
    .eq("restaurant_id", profile!.company_id!)
    .gte("delivery_date", today)
    .lte("delivery_date", thirtyDaysOut)
    .order("delivery_date");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Calendar"
        description="Upcoming deliveries for the next 30 days"
      />
      <DeliveryCalendar orders={orders ?? []} />
    </div>
  );
}
