# Runbook: activate a paying supplier (manual billing)

Billing is not automated at launch. Suppliers submit a plan inquiry (the "Get
this plan" button on `/supplier/billing`), which lands in `plan_inquiries`.

## Steps

1. Review new inquiries:

```sql
SELECT * FROM public.plan_inquiries WHERE status = 'new' ORDER BY created_at DESC;
```

2. Contact the supplier, agree on the plan, and arrange payment out-of-band
   (invoice). Mark the inquiry handled:

```sql
UPDATE public.plan_inquiries SET status = 'contacted' WHERE id = ':inquiry_id';
```

3. Activate the subscription:

```sql
INSERT INTO public.supplier_subscriptions (company_id, plan_code, status, current_period_end)
VALUES (':company_id', 'pro', 'active', now() + interval '1 month')
ON CONFLICT (company_id) DO UPDATE
  SET plan_code = excluded.plan_code,
      status = excluded.status,
      current_period_end = excluded.current_period_end,
      updated_at = now();
```

The supplier's `/supplier/billing` page reflects the plan and status immediately.

## When Paddle is added (later)

This manual flow is replaced by hosted checkout + webhooks; the
`supplier_subscriptions` table and the billing page do not change shape.
