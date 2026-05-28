"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/types";

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PL-${dateStr}-${rand}`;
}

interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export async function placeOrder(data: {
  supplierId: string;
  deliverySlotId: string | null;
  deliveryDate: string;
  notes: string;
  items: CartItem[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id) return { error: "No company" };

  // Get supplier's currency and commission
  const { data: supplierProfile } = await supabase
    .from("companies")
    .select("currency, commission_pct")
    .eq("id", data.supplierId)
    .single();

  if (!supplierProfile) return { error: "Supplier not found" };

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = 0; // MVP: no tax calculation
  const commissionPct = supplierProfile.commission_pct ?? 5;
  const commissionAmt = parseFloat(
    ((subtotal * commissionPct) / 100).toFixed(2)
  );
  const total = subtotal + tax;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      restaurant_id: profile.company_id,
      supplier_id: data.supplierId,
      delivery_slot_id: data.deliverySlotId,
      delivery_date: data.deliveryDate,
      notes: data.notes,
      currency: supplierProfile.currency,
      subtotal,
      tax,
      commission_pct: commissionPct,
      commission_amt: commissionAmt,
      total,
    })
    .select()
    .single();

  if (orderError) return { error: orderError.message };

  // Create order items
  const items = data.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    unit: item.unit,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    total_price: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items);

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/restaurant/orders");
  revalidatePath("/supplier/orders");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status };

  if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();
  if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancel_reason = cancelReason || null;
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/supplier/orders");
  revalidatePath("/restaurant/orders");
  return { success: true };
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: string,
  paymentNote?: string
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { payment_status: paymentStatus };
  if (paymentMethod) updates.payment_method = paymentMethod;
  if (paymentNote) updates.payment_note = paymentNote;
  if (paymentStatus === "paid") updates.paid_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/supplier/orders");
  revalidatePath("/restaurant/orders");
  return { success: true };
}
