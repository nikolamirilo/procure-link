"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CompanyType } from "@/lib/supabase/types";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const companyType = formData.get("companyType") as CompanyType;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_type: companyType,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile with full name
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function slugify(text: string): Promise<string> {
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

  const companyName = formData.get("companyName") as string;
  const companyType = (user.user_metadata?.company_type as string) === "supplier" ? "supplier" : "restaurant";
  const isSupplier = companyType === "supplier";

  const baseSlug = await slugify(companyName);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // Use RPC to run the entire onboarding as a single SECURITY DEFINER transaction
  const { error: rpcError } = await supabase.rpc("complete_onboarding", {
    p_company_name: companyName,
    p_company_type: companyType,
    p_slug: slug,
    p_address: (formData.get("address") as string) || undefined,
    p_city: (formData.get("city") as string) || undefined,
    p_postal_code: (formData.get("postalCode") as string) || undefined,
    p_country: (formData.get("country") as string) || undefined,
    p_phone: (formData.get("phone") as string) || undefined,
    p_email: (formData.get("companyEmail") as string) || undefined,
    p_currency: (formData.get("currency") as string) || "EUR",
    p_cuisine_type: (formData.get("cuisineType") as string) || undefined,
  });

  if (rpcError) return { error: rpcError.message };

  revalidatePath("/", "layout");

  if (isSupplier) {
    redirect("/supplier/dashboard");
  } else {
    redirect("/restaurant/dashboard");
  }
}
