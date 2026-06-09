import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client. Bypasses RLS - use ONLY in trusted server actions for
 * privileged operations (e.g. account deletion). Never expose the key to the
 * client. Returns null if the key is not provisioned so callers can degrade.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
