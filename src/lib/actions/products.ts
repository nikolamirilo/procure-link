"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/_auth";
import { productSchema, firstError } from "@/lib/actions/schemas";

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: (formData.get("description") as string) || "",
    categoryId: (formData.get("categoryId") as string) || null,
    unit: formData.get("unit"),
    price: Number(formData.get("price")),
    minOrderQty: Number(formData.get("minOrderQty")) || 1,
    isAvailable: formData.get("isAvailable") === "true",
    imageUrl: (formData.get("imageUrl") as string) || "",
  });
}

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const p = parsed.data;

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error } = await supabase.from("products").insert({
    supplier_id: companyId,
    name: p.name,
    description: p.description,
    category_id: p.categoryId ?? null,
    unit: p.unit,
    price: p.price,
    min_order_qty: p.minOrderQty,
    is_available: p.isAvailable,
    image_urls: p.imageUrl ? [p.imageUrl] : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/supplier/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const p = parsed.data;

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("products")
    .update({
      name: p.name,
      description: p.description,
      category_id: p.categoryId ?? null,
      unit: p.unit,
      price: p.price,
      min_order_qty: p.minOrderQty,
      is_available: p.isAvailable,
      image_urls: p.imageUrl ? [p.imageUrl] : null,
    })
    .eq("id", id)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Product not found" };
  revalidatePath("/supplier/products");
  return { success: true };
}

export async function toggleProductAvailability(id: string, available: boolean) {
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("products")
    .update({ is_available: available })
    .eq("id", id)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Product not found" };
  revalidatePath("/supplier/products");
  return { success: true };
}

/** Bulk availability toggle - seasonal suppliers flip dozens at once. */
export async function setProductsAvailability(ids: string[], available: boolean) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
    return { error: "Invalid selection" };
  }
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error } = await supabase
    .from("products")
    .update({ is_available: available })
    .in("id", ids)
    .eq("supplier_id", companyId);

  if (error) return { error: error.message };
  revalidatePath("/supplier/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Product not found" };
  revalidatePath("/supplier/products");
  return { success: true };
}
