"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/actions/_auth";
import { sendEmail, planInquiryToFounder } from "@/lib/email/send";
import { z } from "zod";

const inquirySchema = z.object({
  planCode: z.string().trim().max(40),
  message: z.string().trim().max(2000).optional(),
});

/**
 * Records a "get this plan" inquiry. Billing is manual at launch: the founder
 * reviews plan_inquiries and activates supplier_subscriptions by hand. When
 * Paddle is wired this is replaced by hosted checkout (see launch-plan.md E6).
 *
 * Deduped per company+plan: a second submit while one is pending returns the
 * existing state instead of stacking rows, and the founder is notified by
 * email (FOUNDER_EMAIL env var).
 */
export async function createPlanInquiry(formData: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Not authorized" };

  const parsed = inquirySchema.safeParse({
    planCode: formData.get("planCode"),
    message: (formData.get("message") as string) || undefined,
  });
  if (!parsed.success) return { error: "Invalid request" };

  // Dedupe: one open inquiry per company+plan.
  const { data: existing } = await ctx.supabase
    .from("plan_inquiries")
    .select("id, created_at")
    .eq("company_id", ctx.companyId)
    .eq("plan_code", parsed.data.planCode)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { success: true, alreadyRequested: true, createdAt: existing.created_at };
  }

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

  // Best-effort founder notification (no-op without RESEND_API_KEY).
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (founderEmail) {
    const mail = planInquiryToFounder({
      companyName: company?.name ?? "?",
      contactEmail: company?.email ?? "-",
      planCode: parsed.data.planCode,
      message: parsed.data.message ?? "",
    });
    await sendEmail({ to: founderEmail, ...mail });
  }

  revalidatePath("/supplier/billing");
  return { success: true };
}
