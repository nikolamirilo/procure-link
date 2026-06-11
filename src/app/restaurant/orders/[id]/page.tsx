export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getAuthContext } from "@/lib/actions/_auth";
import { OrderDetail } from "@/components/shared/order-detail";
import { RestaurantOrderActions } from "@/components/restaurant/order-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RestaurantOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const { data: order } = await ctx.supabase
    .from("orders")
    .select(
      "*, order_items(*), supplier:companies!orders_supplier_id_fkey(name, phone, email, address, city)"
    )
    .eq("id", id)
    .eq("restaurant_id", ctx.companyId)
    .maybeSingle();

  if (!order) notFound();

  return (
    <OrderDetail
      order={order}
      counterparty={order.supplier}
      counterpartyRole="supplier"
      backHref="/restaurant/orders"
      actions={
        <RestaurantOrderActions
          order={{
            id: order.id,
            order_number: order.order_number,
            status: order.status,
          }}
        />
      }
    />
  );
}
