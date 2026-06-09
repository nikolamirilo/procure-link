"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
  signUpSchema,
  credentialsSchema,
  onboardingSchema,
  firstError,
} from "@/lib/actions/schemas";

// One generic credential error so we never reveal whether an email is
// registered (account-enumeration defence).
const GENERIC_AUTH_ERROR = "Invalid email or password";

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    companyType: formData.get("companyType"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email, password, fullName, companyType } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_type: companyType },
    },
  });

  // Generic message: do not distinguish "already registered" from other
  // failures. The handle_new_user trigger sets profiles.full_name, so no
  // follow-up profile write is needed.
  if (error) return { error: "Could not create your account. Please try again." };

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_AUTH_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: GENERIC_AUTH_ERROR };

  // Route straight to the correct surface. Prefer the JWT app_metadata cache,
  // fall back to a profile lookup before onboarding has populated it.
  const meta = (data.user.app_metadata ?? {}) as {
    company_id?: string;
    role?: string;
  };
  let companyId = meta.company_id;
  let role = meta.role;
  if (!companyId || !role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, companies!profiles_company_id_fkey(type)")
      .eq("id", data.user.id)
      .single();
    companyId = profile?.company_id ?? undefined;
    role = (profile?.companies as unknown as { type?: string } | null)?.type;
  }

  revalidatePath("/", "layout");
  if (!companyId) redirect("/onboarding");
  redirect(role === "supplier" ? "/supplier/dashboard" : "/restaurant/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Sends a password-reset email. Always returns success (no account
 * enumeration). The callback link routes through /auth/callback which
 * exchanges the code and forwards to /reset-password.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { success: true };

  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "";
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  return { success: true };
}

/** Sets a new password for the user in the active recovery session. */
export async function updatePassword(formData: FormData) {
  const password = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .safeParse(formData.get("password"));
  if (!password.success) return { error: firstError(password.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Reset link is invalid or expired" };

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "Could not update password. Please try again." };

  revalidatePath("/", "layout");
  return { success: true };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = onboardingSchema.safeParse({
    companyName: formData.get("companyName"),
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    companyEmail: (formData.get("companyEmail") as string) || undefined,
    currency: (formData.get("currency") as string) || "RSD",
    cuisineType: (formData.get("cuisineType") as string) || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const o = parsed.data;

  // The company type to create is the signup preference, not a routing role.
  const companyType =
    (user.user_metadata?.company_type as string) === "supplier"
      ? "supplier"
      : "restaurant";

  const slug = `${slugify(o.companyName)}-${Date.now().toString(36)}`;

  const { error: rpcError } = await supabase.rpc("complete_onboarding", {
    p_company_name: o.companyName,
    p_company_type: companyType,
    p_slug: slug,
    p_address: o.address,
    p_city: o.city,
    p_postal_code: o.postalCode,
    p_country: o.country,
    p_phone: o.phone,
    p_email: o.companyEmail || undefined,
    p_currency: o.currency,
    p_cuisine_type: o.cuisineType,
  });
  if (rpcError) return { error: rpcError.message };

  revalidatePath("/", "layout");
  redirect(
    companyType === "supplier" ? "/supplier/dashboard" : "/restaurant/dashboard"
  );
}
