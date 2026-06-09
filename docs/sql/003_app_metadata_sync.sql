-- Migration 003: cache role + company_id in auth.users.app_metadata
--
-- Why: proxy.ts and every server action otherwise do an extra profiles+companies
-- lookup on each request. Caching role/company_id in app_metadata (JWT-readable,
-- server-only, NOT user-writable) removes that round-trip. src/lib/actions/_auth.ts
-- reads these values and falls back to a lookup when absent, so this migration is
-- a performance + correctness upgrade and is safe to apply at any time.
--
-- This is additive: a trigger keeps app_metadata in sync whenever a profile's
-- company_id is set or changed, so we do not need to edit complete_onboarding.
--
-- NOTE: app_metadata changes are reflected in a user's JWT on the next token
-- refresh (next sign-in or session refresh). Existing sessions pick it up within
-- the refresh interval; the _auth.ts fallback covers the gap.

CREATE OR REPLACE FUNCTION public.sync_user_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    SELECT type INTO v_role FROM public.companies WHERE id = NEW.company_id;
    UPDATE auth.users
      SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('company_id', NEW.company_id::text, 'role', v_role)
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_app_metadata ON public.profiles;
CREATE TRIGGER trg_sync_app_metadata
  AFTER INSERT OR UPDATE OF company_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_app_metadata();

-- Backfill existing users.
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('company_id', p.company_id::text, 'role', c.type)
FROM public.profiles p
JOIN public.companies c ON c.id = p.company_id
WHERE u.id = p.id AND p.company_id IS NOT NULL;
