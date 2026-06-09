-- Migration 008: supplier verification audit trail
--
-- companies.is_verified already drives the badge. This adds an append-only log
-- of verification events plus the latest verifier/time on companies, so the
-- badge is backed by a real, auditable process (not just a flag someone toggled).

CREATE TABLE IF NOT EXISTS public.supplier_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  verified_by   text NOT NULL,
  verified_at   timestamptz NOT NULL DEFAULT now(),
  notes         text,
  documents_url text[]
);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text;

ALTER TABLE public.supplier_verifications ENABLE ROW LEVEL SECURITY;
-- No public policies: this table is founder-only via the service role / SQL editor.
