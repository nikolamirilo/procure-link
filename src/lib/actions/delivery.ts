"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDeliverySlot(formData: FormData) {
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

  const { error } = await supabase.from("delivery_slots").insert({
    supplier_id: profile.company_id,
    day_of_week: parseInt(formData.get("dayOfWeek") as string),
    start_time: formData.get("startTime") as string,
    end_time: formData.get("endTime") as string,
    zone_name: (formData.get("zoneName") as string) || null,
    max_orders: parseInt(formData.get("maxOrders") as string) || 20,
  });

  if (error) return { error: error.message };

  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function updateDeliverySlot(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_slots")
    .update({
      day_of_week: parseInt(formData.get("dayOfWeek") as string),
      start_time: formData.get("startTime") as string,
      end_time: formData.get("endTime") as string,
      zone_name: (formData.get("zoneName") as string) || null,
      max_orders: parseInt(formData.get("maxOrders") as string) || 20,
      is_active: formData.get("isActive") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function deleteDeliverySlot(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_slots")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function createOffer(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("offers").insert({
    product_id: formData.get("productId") as string,
    discount_pct: parseFloat(formData.get("discountPct") as string),
    start_date: formData.get("startDate") as string,
    end_date: formData.get("endDate") as string,
  });

  if (error) return { error: error.message };

  revalidatePath("/supplier/offers");
  return { success: true };
}

export async function deleteOffer(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("offers").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/offers");
  return { success: true };
}
