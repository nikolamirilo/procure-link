"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/actions/_auth";
import { deliverySlotSchema, offerSchema, firstError } from "@/lib/actions/schemas";

export async function createDeliverySlot(formData: FormData) {
  const parsed = deliverySlotSchema.safeParse({
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    zoneName: (formData.get("zoneName") as string) || null,
    maxOrders: Number(formData.get("maxOrders")) || 20,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error } = await supabase.from("delivery_slots").insert({
    supplier_id: companyId,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    zone_name: s.zoneName ?? null,
    max_orders: s.maxOrders,
  });

  if (error) return { error: error.message };
  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function updateDeliverySlot(id: string, formData: FormData) {
  const parsed = deliverySlotSchema.safeParse({
    dayOfWeek: Number(formData.get("dayOfWeek")),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    zoneName: (formData.get("zoneName") as string) || null,
    maxOrders: Number(formData.get("maxOrders")) || 20,
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("delivery_slots")
    .update({
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      zone_name: s.zoneName ?? null,
      max_orders: s.maxOrders,
      is_active: s.isActive ?? true,
    })
    .eq("id", id)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Delivery slot not found" };
  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function deleteDeliverySlot(id: string) {
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  const { error, data: rows } = await supabase
    .from("delivery_slots")
    .delete()
    .eq("id", id)
    .eq("supplier_id", companyId)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { error: "Delivery slot not found" };
  revalidatePath("/supplier/delivery");
  return { success: true };
}

export async function createOffer(formData: FormData) {
  const parsed = offerSchema.safeParse({
    productId: formData.get("productId"),
    discountPct: Number(formData.get("discountPct")),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const o = parsed.data;

  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  // The offer attaches to a product; confirm that product is ours.
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", o.productId)
    .eq("supplier_id", companyId)
    .maybeSingle();
  if (!product) return { error: "Product not found" };

  // One offer per product per period: overlapping promos are confusing for
  // restaurants and ambiguous at checkout, so reject them at creation.
  const { data: overlapping } = await supabase
    .from("offers")
    .select("id")
    .eq("product_id", o.productId)
    .eq("is_active", true)
    .lte("start_date", o.endDate)
    .gte("end_date", o.startDate)
    .limit(1);
  if (overlapping && overlapping.length > 0) {
    const tErr = await getTranslations("serverErrors");
    return { error: tErr("offerOverlap") };
  }

  const { error } = await supabase.from("offers").insert({
    product_id: o.productId,
    discount_pct: o.discountPct,
    start_date: o.startDate,
    end_date: o.endDate,
  });

  if (error) return { error: error.message };
  revalidatePath("/supplier/offers");
  return { success: true };
}

/** Pause/resume an offer without deleting it. */
export async function toggleOffer(id: string, isActive: boolean) {
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  // Verify ownership through the product before touching the row.
  const { data: offer } = await supabase
    .from("offers")
    .select("id, products!offers_product_id_fkey(supplier_id)")
    .eq("id", id)
    .maybeSingle();
  const ownerId = (offer?.products as unknown as { supplier_id?: string } | null)
    ?.supplier_id;
  if (!offer || ownerId !== companyId) return { error: "Offer not found" };

  const { error } = await supabase
    .from("offers")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/supplier/offers");
  return { success: true };
}

export async function deleteOffer(id: string) {
  const ctx = await requireRole("supplier");
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId } = ctx;

  // Verify the offer belongs to one of our products before deleting.
  const { data: offer } = await supabase
    .from("offers")
    .select("id, products!offers_product_id_fkey(supplier_id)")
    .eq("id", id)
    .maybeSingle();
  const ownerId = (offer?.products as unknown as { supplier_id?: string } | null)
    ?.supplier_id;
  if (!offer || ownerId !== companyId) return { error: "Offer not found" };

  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/supplier/offers");
  return { success: true };
}
