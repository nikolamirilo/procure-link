import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Role = "supplier" | "restaurant";

export interface AuthContext {
  userId: string;
  companyId: string;
  role: Role;
  supabase: SupabaseClient<Database>;
}

/**
 * Resolves the authenticated user together with their company_id and role.
 *
 * Prefers the JWT-cached values in `app_metadata` (written by the
 * `complete_onboarding` SQL function). Falls back to a single profiles lookup
 * so the app keeps working before that migration is applied. Returns null when
 * the caller is unauthenticated or has no company yet - callers decide how to
 * react (server actions return an error object, pages redirect).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = (user.app_metadata ?? {}) as {
    company_id?: string;
    role?: string;
  };
  let companyId = meta.company_id;
  let role = meta.role as Role | undefined;

  if (!companyId || !role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, companies!profiles_company_id_fkey(type)")
      .eq("id", user.id)
      .single();
    companyId = profile?.company_id ?? undefined;
    role =
      ((profile?.companies as unknown as { type?: string } | null)
        ?.type as Role) ?? undefined;
  }

  if (!companyId || !role) return null;
  return { userId: user.id, companyId, role, supabase };
}

/**
 * Like getAuthContext but also asserts the caller has the expected role.
 * Returns null when unauthenticated, without a company, or role mismatch.
 */
export async function requireRole(role: Role): Promise<AuthContext | null> {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== role) return null;
  return ctx;
}
