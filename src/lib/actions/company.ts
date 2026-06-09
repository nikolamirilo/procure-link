"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/actions/_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { companySettingsSchema, firstError } from "@/lib/actions/schemas";

export async function updateCompanySettings(formData: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Not authorized" };
  const { supabase, companyId, role } = ctx;

  const num = (key: string) => {
    const v = formData.get(key);
    return v === null || v === "" ? undefined : Number(v);
  };

  const parsed = companySettingsSchema.safeParse({
    name: formData.get("name"),
    address: (formData.get("address") as string) ?? "",
    city: (formData.get("city") as string) ?? "",
    postalCode: (formData.get("postalCode") as string) ?? "",
    country: (formData.get("country") as string) ?? "",
    phone: (formData.get("phone") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    cuisineType: (formData.get("cuisineType") as string) ?? "",
    currency: (formData.get("currency") as string) || undefined,
    leadTimeHours: num("leadTimeHours"),
    minOrderValue: num("minOrderValue"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;

  // Build an update payload, omitting role-irrelevant fields.
  const update: Record<string, unknown> = {
    name: s.name,
    address: s.address || null,
    city: s.city || null,
    postal_code: s.postalCode || null,
    country: s.country || null,
    phone: s.phone || null,
    email: s.email || null,
    description: s.description || null,
  };
  if (role === "restaurant") {
    update.cuisine_type = s.cuisineType || null;
  } else {
    if (s.currency) update.currency = s.currency;
    if (s.leadTimeHours !== undefined) update.lead_time_hours = s.leadTimeHours;
    if (s.minOrderValue !== undefined) update.min_order_value = s.minOrderValue;
  }

  const { error } = await supabase
    .from("companies")
    .update(update)
    .eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath("/restaurant/settings");
  revalidatePath("/supplier/settings");
  return { success: true };
}

/**
 * Right-to-deletion (GDPR / ZZPL). Deletes the auth user via the service role;
 * company-owned rows are removed by ON DELETE CASCADE foreign keys (see
 * docs/sql/006_account_deletion.sql). Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function deleteAccount() {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Not authorized" };

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Account deletion is not configured. Set SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(ctx.userId);
  if (error) return { error: error.message };

  await ctx.supabase.auth.signOut();
  redirect("/login");
}
