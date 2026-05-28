"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface RecurringOrderItem {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

interface CreateRecurringOrderData {
  name: string;
  supplierId: string;
  frequency: "daily" | "weekly" | "monthly";
  scheduleDays: number[];
  deliveryOffsetDays: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  items: RecurringOrderItem[];
}

export async function createRecurringOrder(data: CreateRecurringOrderData) {
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

  // Create recurring order
  const { data: recurring, error: recError } = await supabase
    .from("recurring_orders")
    .insert({
      restaurant_id: profile.company_id,
      supplier_id: data.supplierId,
      name: data.name,
      frequency: data.frequency,
      schedule_days: data.scheduleDays,
      delivery_offset_days: data.deliveryOffsetDays,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (recError) return { error: recError.message };

  // Insert items
  const items = data.items.map((item) => ({
    recurring_order_id: recurring.id,
    product_id: item.productId,
    product_name: item.productName,
    unit: item.unit,
    unit_price: item.unitPrice,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("recurring_order_items")
    .insert(items);

  if (itemsError) return { error: itemsError.message };

  // Compute next run date
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

export async function updateRecurringOrder(
  id: string,
  data: CreateRecurringOrderData
) {
  const supabase = await createClient();

  // Update main record
  const { error: updateError } = await supabase
    .from("recurring_orders")
    .update({
      name: data.name,
      supplier_id: data.supplierId,
      frequency: data.frequency,
      schedule_days: data.scheduleDays,
      delivery_offset_days: data.deliveryOffsetDays,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      notes: data.notes || null,
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Delete and re-insert items
  await supabase.from("recurring_order_items").delete().eq("recurring_order_id", id);

  const items = data.items.map((item) => ({
    recurring_order_id: id,
    product_id: item.productId,
    product_name: item.productName,
    unit: item.unit,
    unit_price: item.unitPrice,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("recurring_order_items")
    .insert(items);

  if (itemsError) return { error: itemsError.message };

  // Recompute next run
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

export async function toggleRecurringOrder(id: string, isActive: boolean) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { is_active: isActive };

  if (isActive) {
    const { data: nextDate } = await supabase.rpc("compute_next_run_date", {
      p_recurring_order_id: id,
    });
    if (nextDate) updates.next_run_at = nextDate;
  }

  const { error } = await supabase
    .from("recurring_orders")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/restaurant/automations");
  return { success: true };
}

export async function deleteRecurringOrder(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recurring_orders")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/restaurant/automations");
  return { success: true };
}
