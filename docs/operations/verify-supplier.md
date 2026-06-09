# Runbook: verify a supplier

The "Verified supplier" badge (`/restaurant/suppliers/[id]`) must be backed by a
real check. At launch this is a manual founder process.

## Steps

1. Confirm the supplier's business registration (APR) and basic delivery
   capacity - a short call or document review.
2. In the Supabase SQL editor, record the event and flip the flag:

```sql
-- Replace :company_id and your name.
INSERT INTO public.supplier_verifications (company_id, verified_by, notes)
VALUES (':company_id', 'Nikola', 'APR confirmed, delivery capacity verified');

UPDATE public.companies
SET is_verified = true, verified_at = now(), verified_by = 'Nikola'
WHERE id = ':company_id';
```

3. The badge appears immediately on the supplier's profile.

## Disclosure

The badge tooltip already states what "verified" means at this stage
("manually confirmed business registration and delivery capacity"). Keep that
wording honest - do not imply more checking than you actually do.
