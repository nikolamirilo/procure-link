"use server";

import { getAuthContext } from "@/lib/actions/_auth";
import { z } from "zod";

const inquirySchema = z.object({
  planCode: z.string().trim().max(40),
  message: z.string().trim().max(2000).optional(),
});

/**
 * Records a "get this plan" inquiry. Billing is manual at launch: the founder
 * reviews plan_inquiries and activates supplier_subscriptions by hand. When
 * Paddle is wired this is replaced by hosted checkout (see launch-plan.md E6).
 */
export async function createPlanInquiry(formData: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Not authorized" };

  const parsed = inquirySchema.safeParse({
    planCode: formData.get("planCode"),
    message: (formData.get("message") as string) || undefined,
  });
  if (!parsed.success) return { error: "Invalid request" };

  const { data: company } = await ctx.supabase
    .from("companies")
    .select("name, email")
    .eq("id", ctx.companyId)
    .single();

  const { error } = await ctx.supabase.from("plan_inquiries").insert({
    company_id: ctx.companyId,
    plan_code: parsed.data.planCode,
    contact_name: company?.name ?? null,
    contact_email: company?.email ?? null,
    message: parsed.data.message ?? null,
  });
  if (error) return { error: error.message };

  // TODO (Workstream D): notify the founder by email via lib/email/send.
  return { success: true };
}
