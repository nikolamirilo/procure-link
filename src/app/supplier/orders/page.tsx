export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierOrderList } from "@/components/supplier/order-list";

export default async function SupplierOrdersPage() {
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
      "*, order_items(*), restaurant:companies!orders_restaurant_id_fkey(name)"
    )
    .eq("supplier_id", profile!.company_id!)
    .order("placed_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage incoming orders from restaurants"
      />
      <SupplierOrderList orders={orders ?? []} />
    </div>
  );
}
