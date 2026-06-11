"use server";

import { revalidatePath } from "next/cache";
import { requireRole, type AuthContext } from "@/lib/actions/_auth";
import { recurringOrderSchema, firstError } from "@/lib/actions/schemas";
import { placeOrder } from "@/lib/actions/orders";

interface RecurringOrderInput {
  name: string;
  supplierId: string;
  frequency: "daily" | "weekly" | "monthly";
  scheduleDays: number[];
  deliveryOffsetDays: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

/**
 * Re-derives recurring-order line items from the products table so stored
 * names/units/prices reflect the real catalog and all belong to supplierId.
 */
async function resolveItems(
  ctx: AuthContext,
  supplierId: string,
  items: { productId: string; quantity: number }[]
) {
  const ids = items.map((i) => i.productId);
  const { data: products, error } = await ctx.supabase
    .from("products")
    .select("id, name, unit, price, supplier_id")
    .in("id", ids);
  if (error) return { error: error.message as string };

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const resolved = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) return { error: "A selected product no longer exists" };
    if (product.supplier_id !== supplierId) {
      return { error: "A product does not belong to this supplier" };
    }
    resolved.push({
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      unit_price: Number(product.price),
      quantity: item.quantity,
    });
  }
  return { items: resolved };
}

export async function createRecurringOrder(data: RecurringOrderInput) {
  const parsed = recurringOrderSchema.safeParse(data);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const input = parsed.data;

  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const resolved = await resolveItems(ctx, input.supplierId, input.items);
  if ("error" in resolved) return { error: resolved.error };

  const { data: recurring, error: recError } = await supabase
    .from("recurring_orders")
    .insert({
      restaurant_id: companyId,
      supplier_id: input.supplierId,
      name: input.name,
      frequency: input.frequency,
      schedule_days: input.scheduleDays,
      delivery_offset_days: input.deliveryOffsetDays,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (recError) return { error: recError.message };

  const { error: itemsError } = await supabase
    .from("recurring_order_items")
    .insert(resolved.items.map((i) => ({ ...i, recurring_order_id: recurring.id })));

  if (itemsError) {
    await supabase.from("recurring_orders").delete().eq("id", recurring.id);
    return { error: itemsError.message };
  }

  const { data: nextDate } = await supabase.rpc("compute_next_run_date", {
    p_recurring_order_id: recurring.id,
  });
  if (nextDate) {
    await supabase
      .from("recurring_orders")
      .update({ next_run_at: nextDate })
      .eq("id", recurring.id);
  }

  revalidatePath("/restaurant/automations");
  return { success: true, id: recurring.id };
}

export async function updateRecurringOrder(id: string, data: RecurringOrderInput) {
  const parsed = recurringOrderSchema.safeParse(data);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const input = parsed.data;

  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  // Confirm ownership and freeze the supplier - a recurring order may never be
  // repointed at a different supplier via update.
  const { data: existing } = await supabase
    .from("recurring_orders")
    .select("id, supplier_id")
    .eq("id", id)
    .eq("restaurant_id", companyId)
    .maybeSingle();
  if (!existing) return { error: "Recurring order not found" };
  if (input.supplierId !== existing.supplier_id) {
    return { error: "The supplier of a recurring order cannot be changed" };
  }

  const resolved = await resolveItems(ctx, existing.supplier_id, input.items);
  if ("error" in resolved) return { error: resolved.error };

  const { error: updateError, data: updRows } = await supabase
    .from("recurring_orders")
    .update({
      name: input.name,
      frequency: input.frequency,
      schedule_days: input.scheduleDays,
      delivery_offset_days: input.deliveryOffsetDays,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes || null,
    })
    .eq("id", id)
    .eq("restaurant_id", companyId)
    .select("id");

  if (updateError) return { error: updateError.message };
  if (!updRows || updRows.length === 0) return { error: "Recurring order not found" };

  // Replace items. NOTE: this delete+insert is not transactional from the
  // client. The production-grade fix is the update_recurring_order_atomic RPC
  // in docs/sql/atomic-rpcs.sql; apply it and switch this call over.
  await supabase.from("recurring_order_items").delete().eq("recurring_order_id", id);
  const { error: itemsError } = await supabase
    .from("recurring_order_items")
    .insert(resolved.items.map((i) => ({ ...i, recurring_order_id: id })));
  if (itemsError) return { error: itemsError.message };

  const { data: nextDate } = await supabase.rpc("compute_next_run_date", {
    p_recurring_order_id: id,
  });
  if (nextDate) {
    await supabase
      .from("recurring_orders")
      .update({ next_run_at: nextDate })
      .eq("id", id);
  }

  revalidatePath("/restaurant/automations");
  return { success: true };
}

// NOTE: createRecurringOrderDraft was removed. "Save as recurring" from the
// cart now hands items to /restaurant/automations/new via the URL and nothing
// is written until the user saves - no more orphaned invalid drafts.

/**
 * Places a real one-off order from an automation immediately. Lets the user
 * verify an automation end-to-end instead of trusting it blind until the
 * first scheduled run. The run is recorded in the run history.
 */
export async function runRecurringOrderNow(id: string) {
  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { data: rec } = await supabase
    .from("recurring_orders")
    .select(
      "id, supplier_id, delivery_offset_days, notes, recurring_order_items(product_id, quantity)"
    )
    .eq("id", id)
    .eq("restaurant_id", companyId)
    .maybeSingle();
  if (!rec) return { error: "Recurring order not found" };

  const items = (rec.recurring_order_items ?? []).map((i) => ({
    productId: i.product_id,
    quantity: Number(i.quantity),
  }));
  if (items.length === 0) return { error: "This automation has no items" };

  // Target delivery: today + offset, advanced to the supplier's next active
  // delivery weekday (mirrors the validation inside placeOrder).
  const target = new Date();
  target.setDate(target.getDate() + (rec.delivery_offset_days ?? 1));
  const { data: slots } = await supabase
    .from("delivery_slots")
    .select("day_of_week")
    .eq("supplier_id", rec.supplier_id)
    .eq("is_active", true);
  if (slots && slots.length > 0) {
    const allowed = new Set(slots.map((s) => s.day_of_week));
    for (let i = 0; i < 7; i++) {
      if (allowed.has((target.getDay() + 6) % 7)) break;
      target.setDate(target.getDate() + 1);
    }
  }
  const deliveryDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;

  const result = await placeOrder({
    supplierId: rec.supplier_id,
    deliverySlotId: null,
    deliveryDate,
    notes: rec.notes ?? "",
    items,
    idempotencyKey: crypto.randomUUID(),
  });

  const failed = result && "error" in result && result.error;
  await supabase.from("recurring_order_runs").insert({
    recurring_order_id: id,
    status: failed ? "error" : "success",
    order_id: !failed && "orderId" in result ? result.orderId : null,
    error_message: failed ? String(result.error) : null,
  });

  revalidatePath("/restaurant/automations");
  if (failed) return { error: String(result.error) };
  return {
    success: true,
    orderNumber: "orderNumber" in result ? result.orderNumber : "",
  };
}

export async function toggleRecurringOrder(id: string, isActive: boolean) {
  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const updates: Record<string, unknown> = { is_active: isActive };
  if (isActive) {
    const { data: nextDate } = await supabase.rpc("compute_next_run_date", {
      p_recurring_order_id: id,
    });
    if (nextDate) updates.next_run_at = nextDate;
  }

  const { error, data: rows } = await supabase
    .from("recurring_orders")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Recurring order not found" };
  revalidatePath("/restaurant/automations");
  return { success: true };
}

export async function deleteRecurringOrder(id: string) {
  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("recurring_orders")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Recurring order not found" };
  revalidatePath("/restaurant/automations");
  return { success: true };
}
