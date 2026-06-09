# Database migrations

Apply these in order against your Supabase project (SQL editor or CLI) before
deploying the hardened app. They are idempotent where possible.

| # | File | What it does | Required before deploy |
|---|------|--------------|------------------------|
| 001 | `001_orders_idempotency.sql` | Adds `orders.idempotency_key` + unique index. | Yes - `placeOrder` writes this column. |
| 002 | `002_indexes.sql` | Performance indexes on hot query paths. | Recommended. |
| 003 | `003_app_metadata_sync.sql` | Caches `role`/`company_id` in `app_metadata` via trigger + backfill. | Recommended (app falls back gracefully without it). |
| 004 | `004_atomic_rpcs.sql` | `place_orders_atomic` + `update_recurring_order_atomic` transactional RPCs. | Optional now; required to switch the server actions to full atomicity. |
| 005 | `005_rls_audit.sql` | Manual cross-tenant write-isolation audit. | Run on staging; record results. |

Notes:

- 001 is the only hard dependency for the current code. The rest improve
  performance, observability, and atomicity.
- After 003, `app_metadata` updates land in a user's JWT on the next token
  refresh; `src/lib/actions/_auth.ts` falls back to a profile lookup until then.
- Record audit output in `rls-audit-results.md` and re-run 005 after any RLS
  policy change.
