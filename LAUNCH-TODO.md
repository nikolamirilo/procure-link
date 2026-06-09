# ProcureLink - founder to-do (what needs you)

Everything here needs a decision or an account/credential only you can provide.
Grouped by when it blocks. Items I can build are NOT here - those are mine.

## A. Before you can deploy at all

- [x] **SQL migrations applied** (done for you, 2026-06: migrations 001-009 are
      live on the ProcureLink Supabase project, and the TypeScript types were
      regenerated from the real schema). Nothing to do here.
- [ ] **Set environment variables** (locally in `.env.local`, and in Vercel for
      Production/Preview/Development) - see `.env.example`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only; needed for account deletion)
  - [ ] `NEXT_PUBLIC_SITE_URL` (your production domain - used in reset/auth links)
- [ ] **Create the Vercel project**: production = `main` branch, Node 22+, add a
      custom domain + HTTPS.

## B. Before the public launch (legal / trust)

- [ ] **Register / confirm the legal entity** (d.o.o. or preduzetnik, PIB, APR).
      Then replace the `[Naziv pravnog lica ...]` placeholders in
      `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`.
- [ ] **Create the mailboxes** referenced in the legal pages and footer:
      `privatnost@procure-link.com` (privacy) and `podrska@procure-link.com`
      (support / complaints / P2B).
- [ ] **Sign processor DPAs**: Supabase first (Article 28), then Vercel, Resend,
      Sentry, and Paddle when billing launches.
- [ ] **Lawyer review** (Serbia): the software-fee model + fiscalization, and a
      pass over the Terms/Privacy. The fee-only model was chosen specifically to
      avoid payment-institution licensing - confirm that holds.

## C. Decisions I need from you

- [ ] **Pricing**: confirm or change the launch tiers. Currently Basic 2.900 RSD
      / 25 EUR and Pro 5.900 RSD / 49 EUR (in `src/lib/plans.ts`,
      `docs/sql/007_subscriptions.sql`, and the landing page). Change the numbers
      if you want.
- [ ] **Email sending**: get a **Resend** account, verify a sending domain, set
      `RESEND_API_KEY` + `RESEND_FROM_EMAIL`. Until then, order emails silently
      no-op (the app still works).
- [ ] **Billing later**: when ready to automate billing, get a **Paddle** account
      (merchant of record - Stripe won't onboard Serbian businesses). The data
      model and billing page are already built to drop it in.
- [ ] **Observability** (optional but recommended): decide whether to add
      **Sentry** (`@sentry/nextjs`) and a **cookieless analytics** tool
      (Vercel Web Analytics or Plausible). Both need a package install + key.
- [ ] **Uptime monitor**: point UptimeRobot (free) at `GET /api/health`, every 5 min.

## D. Operational, when you have suppliers

- [ ] Verify suppliers using `docs/operations/verify-supplier.md`.
- [ ] Activate paying suppliers using `docs/operations/onboard-paying-supplier.md`.
- [ ] Run the RLS write audit (`docs/sql/005_rls_audit.sql`) on staging and record
      the results before the public launch.
