export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { RestaurantOrderList } from "@/components/restaurant/order-list";

export default async function RestaurantOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, order_items(*), supplier:companies!orders_supplier_id_fkey(name)"
    )
    .eq("restaurant_id", profile!.company_id!)
    .order("placed_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track your orders and deliveries"
      />
      <RestaurantOrderList orders={orders ?? []} />
    </div>
  );
}
