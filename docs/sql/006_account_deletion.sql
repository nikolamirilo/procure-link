-- Migration 006: account-deletion cascade
--
-- Backs the right-to-deletion action (src/lib/actions/company.ts -> deleteAccount),
-- which deletes the auth user via the service role. This ensures that deleting a
-- user / company removes their owned rows rather than orphaning them.
--
-- profiles.id references auth.users(id): make that cascade so deleting the auth
-- user removes the profile. Company-owned data cascades from companies.
--
-- Review your existing FK names in Supabase before running; adjust if they differ.

-- profiles -> auth.users : delete profile when the auth user is deleted.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTE: a company may outlive a single user in a multi-user future. At launch
-- (one user per company) you may also want to delete the company when its sole
-- profile is removed. Do that explicitly in the deletion action or via a
-- trigger if/when you confirm the one-user invariant. The orders/products/etc.
-- already cascade from companies(id) via their existing *_id_fkey constraints.
