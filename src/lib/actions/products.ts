"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductUnit } from "@/lib/supabase/types";

export async function createProduct(formData: FormData) {
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

  const { error } = await supabase.from("products").insert({
    supplier_id: profile.company_id,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category_id: (formData.get("categoryId") as string) || null,
    unit: formData.get("unit") as ProductUnit,
    price: parseFloat(formData.get("price") as string),
    min_order_qty: parseInt(formData.get("minOrderQty") as string) || 1,
    is_available: formData.get("isAvailable") === "true",
  });

  if (error) return { error: error.message };

  revalidatePath("/supplier/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category_id: (formData.get("categoryId") as string) || null,
      unit: formData.get("unit") as ProductUnit,
      price: parseFloat(formData.get("price") as string),
      min_order_qty: parseInt(formData.get("minOrderQty") as string) || 1,
      is_available: formData.get("isAvailable") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/products");
  return { success: true };
}

export async function toggleProductAvailability(id: string, available: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_available: available })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/supplier/products");
  return { success: true };
}
