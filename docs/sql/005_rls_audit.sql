-- RLS write audit
--
-- Run this against staging with TWO real users from DIFFERENT companies to
-- prove tenant isolation on writes, not just reads. The hardened server actions
-- add ownership predicates as belt-and-suspenders, but RLS must be the floor.
--
-- HOW TO RUN: in the Supabase SQL editor, impersonate a user by setting the
-- request JWT claims, then attempt cross-tenant writes. Each cross-tenant write
-- MUST affect 0 rows (UPDATE/DELETE) or be rejected (INSERT).
--
-- Replace the placeholder UUIDs with real values from your staging data:
--   :me_user        -> auth.users.id of tenant A's user
--   :me_company     -> tenant A's companies.id
--   :other_company  -> tenant B's companies.id
--   :other_product  -> a products.id owned by tenant B (a supplier)
--   :other_order    -> an orders.id owned by tenant B
--
-- Example impersonation header (run before each block):
--   SELECT set_config('request.jwt.claims',
--     json_build_object('sub', :'me_user', 'role', 'authenticated')::text, true);

-- 1. SELECT isolation: tenant A must not see tenant B's orders.
-- Expect: 0 rows.
-- SELECT count(*) FROM public.orders WHERE supplier_id = :'other_company';

-- 2. UPDATE on another tenant's product. Expect: 0 rows updated.
-- WITH upd AS (
--   UPDATE public.products SET price = 0.01 WHERE id = :'other_product' RETURNING 1
-- ) SELECT count(*) AS rows_updated FROM upd;

-- 3. DELETE on another tenant's order. Expect: 0 rows deleted.
-- WITH del AS (
--   DELETE FROM public.orders WHERE id = :'other_order' RETURNING 1
-- ) SELECT count(*) AS rows_deleted FROM del;

-- 4. INSERT a product under another tenant's supplier_id. Expect: rejected by RLS.
-- INSERT INTO public.products (supplier_id, name, unit, price)
-- VALUES (:'other_company', 'rls-probe', 'kg', 1);

-- 5. INSERT an order claiming another tenant as the restaurant. Expect: rejected.
-- INSERT INTO public.orders (order_number, restaurant_id, supplier_id, delivery_date,
--   currency, subtotal, commission_pct, commission_amt, total)
-- VALUES ('RLS-PROBE', :'other_company', :'me_company', current_date, 'RSD', 0, 0, 0, 0);

-- Record the observed result of each block in docs/sql/rls-audit-results.md and
-- re-run after every RLS policy change.
