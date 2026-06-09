export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getAuthContext } from "@/lib/actions/_auth";
import { OrderDetail } from "@/components/shared/order-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const { data: order } = await ctx.supabase
    .from("orders")
    .select(
      "*, order_items(*), restaurant:companies!orders_restaurant_id_fkey(name, phone, email, address, city)"
    )
    .eq("id", id)
    .eq("supplier_id", ctx.companyId)
    .maybeSingle();

  if (!order) notFound();

  return (
    <OrderDetail
      order={order}
      counterparty={order.restaurant}
      counterpartyRole="restaurant"
      backHref="/supplier/orders"
    />
  );
}
