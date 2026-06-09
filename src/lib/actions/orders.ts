"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireRole } from "@/lib/actions/_auth";
import {
  placeOrderSchema,
  orderStatusSchema,
  paymentStatusSchema,
  firstError,
} from "@/lib/actions/schemas";
import {
  sendEmail,
  orderPlacedToSupplier,
  orderClosedToRestaurant,
} from "@/lib/email/send";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/types";

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PL-${dateStr}-${rand}`;
}

interface PlaceOrderInput {
  supplierId: string;
  deliverySlotId: string | null;
  deliveryDate: string;
  notes?: string;
  // Only ids and quantities are trusted from the client. Prices, names and
  // units are re-derived server-side from the products table.
  items: { productId: string; quantity: number }[];
  idempotencyKey?: string;
}

export async function placeOrder(data: PlaceOrderInput) {
  const parsed = placeOrderSchema.safeParse(data);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const input = parsed.data;

  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId: restaurantId } = ctx;

  // Idempotency: if this key already produced an order, return it instead of
  // creating a duplicate (guards against double-submit / retry).
  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) return { success: true, orderId: existing.id };
  }

  // Supplier currency + commission.
  const { data: supplier } = await supabase
    .from("companies")
    .select("currency, commission_pct, type")
    .eq("id", input.supplierId)
    .single();
  if (!supplier || supplier.type !== "supplier") {
    return { error: "Supplier not found" };
  }

  // Delivery-day validation: if the supplier publishes active delivery slots,
  // the chosen date must fall on a weekday they actually deliver.
  const { data: slots } = await supabase
    .from("delivery_slots")
    .select("day_of_week")
    .eq("supplier_id", input.supplierId)
    .eq("is_active", true);
  if (slots && slots.length > 0) {
    // delivery_slots.day_of_week is 0=Monday..6=Sunday. JS getDay() is
    // 0=Sunday..6=Saturday, so shift: (getDay()+6)%7.
    const dayIdx = (new Date(input.deliveryDate).getDay() + 6) % 7;
    if (!slots.some((s) => s.day_of_week === dayIdx)) {
      return { error: "This supplier does not deliver on the selected date" };
    }
  }

  // Re-derive every line item from the database. Never trust client prices.
  const productIds = input.items.map((i) => i.productId);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, unit, price, supplier_id, is_available")
    .in("id", productIds);
  if (prodErr) return { error: prodErr.message };

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const lineItems: {
    product_id: string;
    product_name: string;
    unit: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }[] = [];

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) return { error: "A product in your cart no longer exists" };
    if (product.supplier_id !== input.supplierId) {
      return { error: "A product does not belong to this supplier" };
    }
    if (product.is_available === false) {
      return { error: `"${product.name}" is no longer available` };
    }
    const unitPrice = Number(product.price);
    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      unit_price: unitPrice,
      quantity: item.quantity,
      total_price: parseFloat((unitPrice * item.quantity).toFixed(2)),
    });
  }

  const subtotal = parseFloat(
    lineItems.reduce((sum, i) => sum + i.total_price, 0).toFixed(2)
  );
  const tax = 0;
  const commissionPct = supplier.commission_pct ?? 5;
  const commissionAmt = parseFloat(
    ((subtotal * commissionPct) / 100).toFixed(2)
  );
  const total = parseFloat((subtotal + tax).toFixed(2));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      restaurant_id: restaurantId,
      supplier_id: input.supplierId,
      delivery_slot_id: input.deliverySlotId,
      delivery_date: input.deliveryDate,
      notes: input.notes || null,
      currency: supplier.currency ?? "RSD",
      subtotal,
      tax,
      commission_pct: commissionPct,
      commission_amt: commissionAmt,
      total,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select()
    .single();

  if (orderError) return { error: orderError.message };

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

  if (itemsError) {
    // Compensating action: an order with no items is corrupt - roll it back so
    // we never leave a ghost order behind.
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  // Best-effort notification to the supplier (no-op without RESEND_API_KEY).
  const [{ data: sup }, { data: rest }] = await Promise.all([
    supabase.from("companies").select("email").eq("id", input.supplierId).single(),
    supabase.from("companies").select("name").eq("id", restaurantId).single(),
  ]);
  if (sup?.email) {
    const mail = orderPlacedToSupplier("sr", {
      orderNumber: order.order_number,
      restaurantName: rest?.name ?? "",
    });
    await sendEmail({ to: sup.email, ...mail });
  }

  // In-app notification to the supplier's users.
  const { data: supUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", input.supplierId);
  if (supUsers && supUsers.length > 0) {
    await supabase.from("notifications").insert(
      supUsers.map((u) => ({
        user_id: u.id,
        type: "order_placed",
        title: `Nova porudžbina ${order.order_number}`,
        body: rest?.name ?? null,
        data: { order_id: order.id },
      }))
    );
  }

  revalidatePath("/restaurant/orders");
  revalidatePath("/supplier/orders");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
) {
  const parsed = orderStatusSchema.safeParse({ orderId, status, cancelReason });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const ctx = await getAuthContext();
  if (!ctx) return { error: "Not authorized" };
  const { supabase, role, companyId } = ctx;

  const updates: Record<string, unknown> = { status };
  if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();
  if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancel_reason = cancelReason || null;
  }

  // Scope the update to rows this tenant owns - belt and suspenders over RLS.
  let query = supabase.from("orders").update(updates).eq("id", orderId);
  query =
    role === "supplier"
      ? query.eq("supplier_id", companyId)
      : query.eq("restaurant_id", companyId);

  const { error, data: rows } = await query.select("id");
  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Order not found" };

  // Close the loop to the restaurant when an order is delivered or cancelled.
  if (status === "delivered" || status === "cancelled") {
    const { data: ord } = await supabase
      .from("orders")
      .select("order_number, restaurant_id, restaurant:companies!orders_restaurant_id_fkey(email)")
      .eq("id", orderId)
      .single();
    const email = (ord?.restaurant as unknown as { email?: string } | null)?.email;
    if (email && ord) {
      const mail = orderClosedToRestaurant("sr", {
        orderNumber: ord.order_number,
        status,
      });
      await sendEmail({ to: email, ...mail });
    }
    if (ord) {
      const { data: restUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", ord.restaurant_id);
      if (restUsers && restUsers.length > 0) {
        const statusText = status === "delivered" ? "isporučena" : "otkazana";
        await supabase.from("notifications").insert(
          restUsers.map((u) => ({
            user_id: u.id,
            type: `order_${status}`,
            title: `Porudžbina ${ord.order_number} je ${statusText}`,
            body: null,
            data: { order_id: orderId },
          }))
        );
      }
    }
  }

  revalidatePath("/supplier/orders");
  revalidatePath("/restaurant/orders");
  return { success: true };
}

/**
 * Records payment receipt. Suppliers only - a restaurant marking its own order
 * paid is a trust hole, so this is gated to the supplier that owns the order.
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: string,
  paymentNote?: string
) {
  const parsed = paymentStatusSchema.safeParse({
    orderId,
    paymentStatus,
    paymentMethod,
    paymentNote,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const updates: Record<string, unknown> = { payment_status: paymentStatus };
  if (paymentMethod) updates.payment_method = paymentMethod;
  if (paymentNote) updates.payment_note = paymentNote;
  if (paymentStatus === "paid") updates.paid_at = new Date().toISOString();

  const { error, data: rows } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Order not found" };

  revalidatePath("/supplier/orders");
  revalidatePath("/restaurant/orders");
  return { success: true };
}
