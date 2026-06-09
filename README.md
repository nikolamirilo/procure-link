# ProcureLink

B2B procurement marketplace connecting restaurants and suppliers in Serbia.
Next.js 16 (App Router, `proxy.ts` middleware), Supabase (Postgres + Auth + RLS),
Tailwind v4, shadcn UI, next-intl (Serbian default, English toggle).

## Prerequisites

- Node 22+
- A Supabase project
- npm

## Local setup

1. `cp .env.example .env.local` and fill in the Supabase values (see `.env.example`).
2. Apply the SQL migrations in `docs/sql/` in order (see below).
3. `npm install`
4. `npm run dev` and open http://localhost:3000

## Database migrations

Apply in order in the Supabase SQL editor (details in `docs/sql/README.md`):

1. `001_orders_idempotency.sql` - **required before deploy** (checkout writes this column)
2. `002_indexes.sql` - performance indexes
3. `003_app_metadata_sync.sql` - cache role/company_id in app_metadata
4. `004_atomic_rpcs.sql` - transactional checkout / recurring-update RPCs
5. `005_rls_audit.sql` - run on staging, record results
6. `006_account_deletion.sql` - cascade backing right-to-deletion
7. `007_subscriptions.sql` - plans, subscriptions, inquiries

## Scripts

- `npm run dev` - dev server
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm run typecheck` - `tsc --noEmit`

## Deployment (Vercel)

- Production branch: `main`; previews for all other branches.
- Set env vars in all three environments. `SUPABASE_SERVICE_ROLE_KEY` is
  **server-only and production-scoped** - it bypasses RLS; never log it; rotate
  immediately if leaked.
- Health check: `GET /api/health` (point UptimeRobot here, every 5 min).

## Project layout

- `src/app` - routes (`(auth)`, `restaurant/*`, `supplier/*`, `api/*`, legal pages)
- `src/lib/actions` - server actions (auth, orders, products, delivery, recurring, company, billing) + Zod `schemas.ts` + `_auth.ts`
- `src/i18n` - next-intl config, request, locale-switch action; catalogs in `/messages`
- `src/components` - `ui` (shadcn), `shared`, `restaurant`, `supplier`, `landing`, `legal`
- `docs/sql` - migrations; `docs/operations` - runbooks, legal checklist, capacity

## Remaining founder to-dos before public launch

See `docs/operations/legal-checklist.md` and `launch-plan.md`. In short: fill the
legal-entity placeholders in `/privacy` and `/terms`, sign processor DPAs, set
the service-role key, optionally wire Sentry + analytics, and have a Serbian
lawyer review the fee model.
