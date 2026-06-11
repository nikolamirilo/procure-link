"use server";

import { revalidatePath } from "next/cache";
import { getTranslations, getLocale } from "next-intl/server";
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
import { applyDiscount, bestDiscounts, todayStr } from "@/lib/pricing";
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
  /** Preferred delivery time (HH:MM), stored structured - not in notes. */
  deliveryTime?: string;
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
      .select("id, order_number")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return {
        success: true,
        orderId: existing.id,
        orderNumber: existing.order_number,
      };
    }
  }

  const tErr = await getTranslations("serverErrors");

  // Supplier currency, commission and ordering constraints.
  const { data: supplier } = await supabase
    .from("companies")
    .select("currency, commission_pct, type, min_order_value, lead_time_hours")
    .eq("id", input.supplierId)
    .single();
  if (!supplier || supplier.type !== "supplier") {
    return { error: "Supplier not found" };
  }

  // Lead-time enforcement: the end of the delivery day must be at least
  // lead_time_hours away. Mirrored client-side in the date picker; this is
  // the trust boundary.
  if (supplier.lead_time_hours && supplier.lead_time_hours > 0) {
    const endOfDeliveryDay = new Date(`${input.deliveryDate}T23:59:59`);
    const earliest = new Date(
      Date.now() + supplier.lead_time_hours * 60 * 60 * 1000
    );
    if (endOfDeliveryDay < earliest) {
      return { error: tErr("leadTime", { hours: supplier.lead_time_hours }) };
    }
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
      return { error: tErr("noDeliveryDay") };
    }
  }

  // Re-derive every line item from the database. Never trust client prices.
  const productIds = input.items.map((i) => i.productId);
  const [{ data: products, error: prodErr }, { data: activeOffers }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, unit, price, supplier_id, is_available")
        .in("id", productIds),
      // Active offers are applied server-side - the badge a restaurant saw in
      // browse and the price charged here go through the same applyDiscount.
      supabase
        .from("offers")
        .select("product_id, discount_pct")
        .in("product_id", productIds)
        .eq("is_active", true)
        .lte("start_date", todayStr())
        .gte("end_date", todayStr()),
    ]);
  if (prodErr) return { error: prodErr.message };
  const discounts = bestDiscounts(activeOffers ?? []);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const lineItems: {
    product_id: string;
    product_name: string;
    unit: string;
    unit_price: number;
    original_unit_price: number | null;
    discount_pct: number | null;
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
    const listPrice = Number(product.price);
    const pct = discounts.get(product.id) ?? 0;
    const unitPrice = applyDiscount(listPrice, pct);
    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      unit_price: unitPrice,
      original_unit_price: pct > 0 ? listPrice : null,
      discount_pct: pct > 0 ? pct : null,
      quantity: item.quantity,
      total_price: parseFloat((unitPrice * item.quantity).toFixed(2)),
    });
  }

  const subtotal = parseFloat(
    lineItems.reduce((sum, i) => sum + i.total_price, 0).toFixed(2)
  );

  // Minimum order value enforcement. The cart shows the same constraint with
  // a "add X more" hint before checkout is even possible.
  const minOrder = Number(supplier.min_order_value ?? 0);
  if (minOrder > 0 && subtotal < minOrder) {
    return { error: tErr("belowMin", { min: minOrder }) };
  }

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
      delivery_time: input.deliveryTime || null,
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
  const locale = await getLocale();
  const tNotif = await getTranslations("notif");
  const [{ data: sup }, { data: rest }] = await Promise.all([
    supabase.from("companies").select("email").eq("id", input.supplierId).single(),
    supabase.from("companies").select("name").eq("id", restaurantId).single(),
  ]);
  if (sup?.email) {
    const mail = orderPlacedToSupplier(locale === "en" ? "en" : "sr", {
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
        title: tNotif("orderPlacedTitle", { number: order.order_number }),
        body: rest?.name ?? null,
        data: { order_id: order.id },
      }))
    );
  }

  revalidatePath("/restaurant/orders");
  revalidatePath("/supplier/orders");
  return { success: true, orderId: order.id, orderNumber: order.order_number };
}

/**
 * Builds cart-ready items from a past order, revalidated against the live
 * catalog: vanished/unavailable products are dropped, prices are refreshed.
 * Returns diff counts so the UI can tell the user exactly what changed.
 */
export async function getReorderItems(orderId: string) {
  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, supplier_id, order_items(product_id, quantity, unit_price), supplier:companies!orders_supplier_id_fkey(name, currency)"
    )
    .eq("id", orderId)
    .eq("restaurant_id", companyId)
    .maybeSingle();
  if (!order) return { error: "Order not found" };

  const supplier = order.supplier as unknown as {
    name?: string;
    currency?: string;
  } | null;

  const ids = order.order_items.map((i) => i.product_id);
  const [{ data: products }, { data: activeOffers }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, unit, price, min_order_qty, is_available")
      .in("id", ids),
    supabase
      .from("offers")
      .select("product_id, discount_pct")
      .in("product_id", ids)
      .eq("is_active", true)
      .lte("start_date", todayStr())
      .gte("end_date", todayStr()),
  ]);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const discounts = bestDiscounts(activeOffers ?? []);

  let changed = 0;
  let unavailable = 0;
  const items: {
    productId: string;
    productName: string;
    unit: string;
    unitPrice: number;
    originalUnitPrice?: number;
    discountPct?: number;
    quantity: number;
    supplierId: string;
    supplierName: string;
    minQty: number;
    currency: string;
  }[] = [];

  for (const oi of order.order_items) {
    const p = byId.get(oi.product_id);
    if (!p || p.is_available === false) {
      unavailable++;
      continue;
    }
    const pct = discounts.get(p.id) ?? 0;
    const effective = applyDiscount(Number(p.price), pct);
    // Compare effective vs what was charged last time - a promo starting or
    // ending since the original order IS a price change worth flagging.
    if (effective !== Number(oi.unit_price)) changed++;
    items.push({
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      unitPrice: effective,
      ...(pct > 0
        ? { originalUnitPrice: Number(p.price), discountPct: pct }
        : {}),
      quantity: Math.max(oi.quantity, p.min_order_qty ?? 1),
      supplierId: order.supplier_id,
      supplierName: supplier?.name ?? "",
      minQty: p.min_order_qty ?? 1,
      currency: supplier?.currency ?? "RSD",
    });
  }

  return { success: true, items, changed, unavailable };
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
  if (status === "dispatched") updates.dispatched_at = new Date().toISOString();
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
    const locale = await getLocale();
    if (email && ord) {
      const mail = orderClosedToRestaurant(locale === "en" ? "en" : "sr", {
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
        const tNotif = await getTranslations("notif");
        await supabase.from("notifications").insert(
          restUsers.map((u) => ({
            user_id: u.id,
            type: `order_${status}`,
            title:
              status === "delivered"
                ? tNotif("orderDeliveredTitle", { number: ord.order_number })
                : tNotif("orderCancelledTitle", { number: ord.order_number }),
            body: cancelReason || null,
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
