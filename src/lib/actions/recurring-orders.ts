"use server";

import { revalidatePath } from "next/cache";
import { requireRole, type AuthContext } from "@/lib/actions/_auth";
import { recurringOrderSchema, firstError } from "@/lib/actions/schemas";

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

/**
 * Creates an inactive draft recurring order from a cart's supplier group and
 * returns its id, so the cart can redirect to the edit page. Replaces the old
 * query-string encoding that silently truncated large carts.
 */
export async function createRecurringOrderDraft(
  supplierId: string,
  items: { productId: string; quantity: number }[]
) {
  const ctx = await requireRole("restaurant");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const resolved = await resolveItems(ctx, supplierId, items);
  if ("error" in resolved) return { error: resolved.error };

  const { data: draft, error } = await supabase
    .from("recurring_orders")
    .insert({
      restaurant_id: companyId,
      supplier_id: supplierId,
      name: "Nova automatizacija",
      frequency: "weekly",
      schedule_days: [],
      delivery_offset_days: 1,
      is_active: false,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: itemsError } = await supabase
    .from("recurring_order_items")
    .insert(resolved.items.map((i) => ({ ...i, recurring_order_id: draft.id })));
  if (itemsError) {
    await supabase.from("recurring_orders").delete().eq("id", draft.id);
    return { error: itemsError.message };
  }

  return { success: true, id: draft.id };
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
