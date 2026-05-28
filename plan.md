# ProcureLink - Production Readiness Plan (revised after multi-LLM stress-test)

**Scope:** Hardened MVP for pilot users (10-50 real customers)
**Deploy target:** Vercel
**Team:** Solo
**Date:** 2026-05-28
**Revision:** v2 - stress-tested in parallel by security, performance, UX, and legal/compliance agents. Cross-cutting findings folded in; phase order and drop list updated.

---

## 1. Executive summary

The bones of the app are right: Next.js 16 with the new `proxy.ts` convention, Supabase auth + RLS, two clean role-separated sections, server actions for writes, an RPC-based transactional onboarding, and a recent DB restructure that eliminated the role/company-type split-identity bug.

What's missing for production is not architecture - it is correctness in the write path, ownership enforcement above RLS, transactional integrity for multi-step operations, honest marketing copy, and the surface a pilot user needs (order detail page, company settings, edit routes that aren't dead links). The first version of this plan treated marketing and missing UX pages as polish; the stress-test surfaced both as pilot-day-one blockers and they have been moved up.

Total realistic effort solo: **2.5 - 3 weeks** of focused work. Heavier in Phase 1 than the previous plan.

---

## 2. Phase 1 - Correctness, security, and trust (4-5 days)

**Goal:** Eliminate data-corruption bugs, ownership gaps, and any user-facing surface that would discredit the product on day one.

### 2.1 Write-path correctness and IDOR fixes

Every server action that mutates data is currently trusting RLS as the only ownership boundary. Belt-and-suspenders fixes:

- [ ] **Add explicit ownership predicates** to every `.update()`/`.delete()` call. For supplier-owned rows (products, delivery slots, offers, supplier-facing order fields): `.eq("supplier_id", profile.company_id)`. For restaurant-owned rows (recurring orders, cart, restaurant-facing order fields): `.eq("restaurant_id", profile.company_id)`. Files: `src/lib/actions/orders.ts:106-156`, `products.ts:38-83`, `delivery.ts:35-94`, `recurring-orders.ts:91-182`.
- [ ] **Re-derive prices server-side** in `placeOrder` (`orders.ts:22-103`). Do not trust `unitPrice` or `productName` from the client cart. Look up `products.price`, `products.name`, `products.unit` by `product_id` and reject the order if any product is unavailable or belongs to a different supplier than `data.supplierId`.
- [ ] **Reject mismatched `supplier_id` mutations** in `updateRecurringOrder` (`recurring-orders.ts:102`) - currently lets a caller change which supplier a recurring order ships to.
- [ ] **Remove `updatePaymentStatus` from the restaurant surface** entirely. Restaurants marking their own orders paid is a trust killer; only the supplier should record payment receipt. File: `src/components/restaurant/order-list.tsx`.

### 2.2 Input validation with Zod

Zod is already a dependency. Use it.

- [ ] Define one schema per server action input in `src/lib/actions/schemas.ts`. Each server action parses `formData` (or its typed argument) through `schema.safeParse` and returns `{ error: parsed.error.message }` on failure.
- [ ] Reject negatives, NaN, malformed UUIDs, oversize strings. Critical fields: `unitPrice`, `quantity`, `discount_pct`, `commission_pct`, `min_order_qty`, postal codes, phone numbers, UUIDs.
- [ ] **Server-side password length enforcement** in `signUp` (`auth.ts:16`) - client `minLength` is bypassable via curl.

### 2.3 Transactional integrity

- [ ] **Atomic multi-supplier place** - the cart loops `placeOrder` per supplier sequentially (`cart/page.tsx:86-130`). A partial failure leaves orders in inconsistent state. Replace with an RPC `place_orders_atomic(payload jsonb)` that wraps all suppliers' inserts in a single PL/pgSQL transaction, returns `[{ supplier_id, order_id, order_number }]`, and accepts an idempotency key (UUID generated client-side, stored on the order, unique-indexed).
- [ ] **Make `placeOrder` atomic** - the current two-step insert (orders, then order_items) is not transactional. Fold both into the RPC above; drop the standalone `placeOrder` server action or have it call the RPC.
- [ ] **Atomic `updateRecurringOrder`** - currently deletes then re-inserts items in two non-transactional calls (`recurring-orders.ts:91-141`). Move to RPC `update_recurring_order_atomic`.

### 2.4 Auth bugs and proxy caching

- [ ] **Fix `signUp`**: remove the redundant `profiles.full_name` update (`auth.ts:32-40`); the DB trigger already does it.
- [ ] **Fix `signIn`**: redirect directly to the role-specific dashboard, not `/`. Read `company_type` from `app_metadata` (see next item) or do one targeted lookup.
- [ ] **Cache role and company_id in `app_metadata`** (the JWT-readable, server-only field). Set them inside the `complete_onboarding` SQL function (which is `SECURITY DEFINER` so it can write `auth.users.raw_app_meta_data`). Read from JWT in `proxy.ts` AND in every server action that currently calls `auth.getUser() + profiles.select("company_id")`. **Critical paired change:** `onboarding/page.tsx:47` currently reads `user_metadata.company_type` - migrate that read to `app_metadata` too or the onboarding form will flip suppliers to the restaurant form.
- [ ] **Generic auth error messages** - do not echo Supabase's `User already registered` vs `Invalid login credentials`. Return one generic string for both. Files: `auth.ts:28, 58`.
- [ ] **Guard server components** - replace `user!.id` with explicit redirect in every dashboard and layout (`restaurant/dashboard/page.tsx:17` and equivalents).

### 2.5 Proxy and routing hygiene

- [ ] **Whitelist `/api/*` in the proxy public-routes list** (`proxy.ts:39`) before adding Phase 4's `/api/health`. Otherwise UptimeRobot will get 307'd to `/login` and silently report DOWN.
- [ ] **Open-redirect guard** on the password-reset `next=` param that will arrive with Phase 2's reset flow. Validate against an allowlist of in-app paths.

### 2.6 Security headers (Phase 1, not deferred)

The original plan deferred CSP. With unsanitized user-provided `description`, `notes`, `name`, and `companyName` rendered in the browser, that was the wrong call.

- [ ] In `next.config.ts`, add a `headers()` block with:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://*.sentry.io; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'`
- [ ] Verify `next/server-actions` works with this CSP in preview before promoting to production.

### 2.7 Marketing copy honesty (moved up from Phase 5)

A pilot user reads the landing page before they trust the form. Fabricated testimonials are a sharper legal exposure than the SLA claim under the EU Omnibus Directive and Serbian consumer protection law (Zakon o zastiti potrosaca).

- [ ] **Remove or relabel fabricated stats** in `src/app/page.tsx`:
  - Line 215: "Trusted by 2,400+ restaurants worldwide" - replace with "In private beta" or remove.
  - Lines 145-149: stats bar (2,400+, 850+, 1.2M, 99.9% SLA) - remove the bar entirely, or replace with three honest milestones.
  - Line 267: "Rated 4.9/5 from 500+ reviews" - remove.
- [ ] **Remove fabricated testimonials** (lines 151-173). Replace the section with "Testimonials from pilot users coming soon" or hide the section behind a feature flag until you have real ones.
- [ ] **Pricing section** (lines 92-142):
  - Hide the section entirely until billing ships, OR
  - Replace every CTA with "Join the pilot - free during beta" and add a one-line disclosure that pricing shown is indicative.
  - Fix `$` rendered next to "EUR 49" (line 599) - currency symbol mismatch is its own misrepresentation.
- [ ] **"Verified suppliers" claim** (lines 55, 391): either remove the word "verified" everywhere until you have a real verification process, or qualify it ("manually reviewed by our team during beta").
- [ ] **"No hidden fees"** (line 570): with an undisclosed commission model, this line is unsafe. Remove or replace with "Transparent commission - see Terms".
- [ ] **Replace dead `#` legal links** (footer): point Privacy and Terms to real routes that exist (even if those routes show a placeholder during Phase 1 - "Privacy Policy - draft, full version coming before public launch" is honest; `#` is not).

### 2.8 Schema indexes

Add `docs/sql/indexes.sql` with all of these and run against Supabase:

```sql
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_status ON orders(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_placed ON orders(restaurant_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_delivery ON orders(restaurant_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_delivery ON orders(supplier_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier_available ON products(supplier_id, is_available);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_active_next ON recurring_orders(next_run_at) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_companies_type_verified ON companies(type, is_verified);
```

### 2.9 RLS audit covering writes

The first plan only audited SELECT.

- [ ] Write `docs/sql/rls-audit.sql` that, signed in as two different users from different companies, asserts:
  - SELECT isolation (existing)
  - UPDATE attempts on other tenant's rows return 0 rows affected
  - DELETE attempts on other tenant's rows return 0 rows affected
  - INSERT with another tenant's `restaurant_id`/`supplier_id` is rejected
- [ ] Run once against staging Supabase, paste output into `docs/sql/rls-audit-results.md`. Re-run after every RLS policy change.

### 2.10 Confirmation gates on destructive or state-changing actions

- [ ] Confirmation modal on Place Order (commits real money)
- [ ] Confirmation modal on every order status transition (irreversible today)
- [ ] Confirmation modal on supplier's "Mark Paid"
- [ ] Confirmation modal on cancel/delete already-confirmed orders, recurring orders, products

---

## 3. Phase 2 - Reliability, missing pages, and UX polish (4-5 days)

**Goal:** No white screens. No dead links. No stuck users. First-time supplier/restaurant onboarding sequences naturally into productive use.

### 3.1 Error and loading surfaces

- [ ] **`src/app/error.tsx`** (root) with friendly copy and `reset()` button
- [ ] **`src/app/global-error.tsx`** (catches root layout errors)
- [ ] **`loading.tsx`** in `restaurant/`, `supplier/`, plus list pages (orders, browse, products) - skeletons not spinners
- [ ] **`not-found.tsx`** at root

Per-section `error.tsx` was deferred from the original plan - root + global covers pilot failure modes.

### 3.2 Missing pages (dead links and stuck states today)

- [ ] **`src/app/restaurant/automations/[id]/edit/page.tsx`** - the detail page links here and the route does not exist. Currently a 404.
- [ ] **Order detail page** for both roles: `restaurant/orders/[id]/page.tsx` and `supplier/orders/[id]/page.tsx`. Show full item breakdown, notes, status history, supplier/restaurant contact info, order number. Today both list views are flat tables with no drill-in.
- [ ] **Company settings page** for both roles: `restaurant/settings/page.tsx`, `supplier/settings/page.tsx`. Edit address, phone, business email, cuisine type (restaurant), currency / commission display / lead time (supplier). Today a typo at onboarding strands the user.
- [ ] **Supplier profile page** at `restaurant/suppliers/[id]/page.tsx` - clicking a supplier name from browse goes there. Show name, verified badge (if applicable), address, phone, products by this supplier. Restaurants vet before ordering.

### 3.3 Auth flows

- [ ] Password reset: `/forgot-password` form, `/auth/callback` handler, `/reset-password` page. Wire to `supabase.auth.resetPasswordForEmail` and `updateUser`. Apply the open-redirect guard from 2.5.
- [ ] Email verification UX: post-signup "check your inbox" page, callback handles confirm and routes to onboarding.

### 3.4 First-user empty-state sequencing

- [ ] **Supplier dashboard onboarding nudge**: if `products_count == 0`, show a "Set up your storefront" card with 3 sequenced steps (Add your first product → Set delivery slots → Request verification). Cards stay until each step is done.
- [ ] **Restaurant browse empty state**: when no suppliers exist, show "No suppliers in your region yet - we will email you when one joins" with an email-capture button. Today says "Try adjusting your search" which is misleading.
- [ ] **All list pages**: real empty states with a CTA, not blank tables.

### 3.5 Form and flow correctness

- [ ] **Delivery date picker validation** - reject dates that have no matching active `delivery_slots` row for the supplier on that `day_of_week`. Surface available delivery days in a calendar with disabled dates.
- [ ] **Cart "Save as Recurring"** - currently URL-encodes the whole cart into the query string (`cart/page.tsx:283`). 30-item cart silently truncates. Replace with a server action that creates a draft `recurring_orders` row + items, then redirects to its edit page.
- [ ] **Form submit state** via `useFormStatus` instead of manual `loading` state in register/login/onboarding - manual state races against React 19 transitions.
- [ ] **Toast feedback** via `sonner` on every server-action result; inline form errors only for validation.

### 3.6 Mobile pass

- [ ] Walk every flow at 375px. Verify the sidebar-as-sheet mobile pattern (`mobile-header.tsx` exists). Fix what breaks.

---

## 4. Phase 3 - Pilot-essential features (4-5 days)

**Goal:** Pilot users can run a real end-to-end purchase with the same trust signals they would expect from a "real" product.

### 4.1 Product images (elevated from original Phase 3; this is pilot-critical)

- [ ] Supabase Storage bucket `product-images`, RLS policy: supplier writes within own folder, authenticated users read.
- [ ] Set MIME allowlist (jpg, png, webp), max 2MB per file, max 5 images per product.
- [ ] Upload UI in `src/components/supplier/product-form.tsx`.
- [ ] Render in `src/components/restaurant/product-browser.tsx` and the supplier profile page.
- [ ] Configure `next.config.ts` `images.remotePatterns` for the Supabase storage domain. **Set `unoptimized: true` for these URLs OR cap `images.minimumCacheTTL` and budget against Vercel's 1000 transformations/month free limit.**

### 4.2 Transactional emails (slimmed)

Resend free tier is 100/day, 3K/mo. The original plan's 5 status-change emails will burn through quota on Mondays. Ship the two that matter and add more later only with cause.

- [ ] **Order placed → supplier** (their action queue lit up)
- [ ] **Order delivered or cancelled → restaurant** (close the loop)
- [ ] **Recurring order failed (`recurring_order_runs.status = 'failed'`) → restaurant owner** (operational integrity)
- [ ] Implement as `src/lib/email/send.ts` + 3 React Email templates. Trigger from server actions and the Edge Function for recurring runs.
- [ ] Add `beforeSend` PII scrubber for the Sentry integration in Phase 4 - server-action stack traces capture formData.

### 4.3 Supplier verification (real, not just a flag)

- [ ] New table `supplier_verifications` (one row per verification event): `id`, `company_id`, `verified_by`, `verified_at`, `notes`, `documents_url[]`. Append-only audit trail.
- [ ] Add `verified_at` and `verified_by` to `companies` for the latest verification.
- [ ] Pilot process: founder verifies via SQL by inserting into `supplier_verifications` and updating `companies.is_verified`. Document in `docs/operations/verify-supplier.md`.
- [ ] **Verified badge** in browse + on supplier profile page.
- [ ] **Disclosure**: a tooltip or info icon on the badge explains what "verified" means at pilot stage ("We've manually confirmed this supplier's business registration and delivery capacity"). Without this disclosure, the badge is a legal liability (see Phase 5).

### 4.4 Dropped from this phase (defer post-pilot)

- ~~Notifications bell UI~~ - email is enough at < 50 users
- ~~Product full-text search (tsvector)~~ - client-side filter against ~5000 products is fine; revisit when you have more suppliers
- ~~Analytics (Vercel/Plausible)~~ - useless with users you know by name

---

## 5. Phase 4 - Deploy and observability (1-2 days)

- [ ] **`.env.example`** with every var documented, no values. Include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (mark "server only, never expose"), `RESEND_API_KEY`, `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`.
- [ ] **`SUPABASE_SERVICE_ROLE_KEY` provisioning** - required by Phase 1's `app_metadata` writes and Phase 3's recurring-orders Edge Function. Set in Vercel as a non-public env var, scoped to production only. Document the blast radius in README ("this key bypasses RLS; never log it; rotate immediately if leaked").
- [ ] **README rewrite**: prereqs, local setup, Supabase project setup steps, the SQL migrations in order (restructure plan → indexes → RLS audit), deployment notes.
- [ ] **Vercel config**: production = `main`, preview for everything else, env vars in all three environments, Node 22+.
- [ ] **`src/app/api/health/route.ts`** - returns 200 only if a trivial Supabase `categories` SELECT succeeds. Whitelist `/api/*` in `proxy.ts` (Phase 1 task 2.5).
- [ ] **Custom domain + HTTPS** via Vercel.
- [ ] **Sentry** (`@sentry/nextjs`) instrumented on **server actions and the `error.tsx` boundary only - not `proxy.ts`** (proxy is hot-path and bot scans will burn the free quota with noise). Configure `beforeSend` to scrub `email`, `password`, `phone` from event payloads.
- [ ] **Uptime monitor**: UptimeRobot free tier, hits `/api/health` every 5 minutes.
- [ ] **Document Vercel + Supabase tier ceilings** in `docs/operations/capacity.md`. Free tiers will hit a wall at:
  - Supabase 2GB egress/mo (`browse/page.tsx` is the biggest egress source - mitigated by pagination work in Phase 2.5; revisit if egress spikes)
  - Resend 100 emails/day (mitigated by slimming to 3 events in Phase 3)
  - Vercel 100K function invocations/day (mitigated by `app_metadata` caching in Phase 1)
  - Vercel 1000 image transformations/mo (mitigated by `unoptimized` for product images in Phase 3)
  Decision: upgrade Supabase to Pro ($25/mo) on the day the first paying pilot starts.

---

## 6. Phase 5 - Legal, business model, and final copy (2-3 days)

**Goal:** Nothing on the public-facing surface or in the data flow would embarrass you in front of a real user, a lawyer, or an EU regulator.

### 6.1 GDPR / data protection (in-scope from your first EU user)

- [ ] **Sign the Supabase DPA** (Data Processing Agreement). Supabase offers one but it is not auto-applied. Without it, every EU user means an Article 28 breach.
- [ ] **Privacy notice at point of collection** (Article 13): inline note on `register/page.tsx` and `onboarding/page.tsx` linking to the Privacy Policy, stating lawful basis (contract performance for business contact data) and listing processors (Supabase, Vercel, Resend, Sentry, UptimeRobot).
- [ ] **Real Privacy Policy** at `/privacy`. Use Termly or Iubenda B2B/marketplace template. Must list all processors and explain commission data flow.
- [ ] **Right-to-deletion endpoint** - a Settings page button that triggers `auth.admin.deleteUser` + cascading data deletion. Required by GDPR; one-day build using existing patterns.
- [ ] **Cookie policy / banner** - skip if you stay cookieless (no Vercel Analytics, no Plausible, no third-party scripts). Confirm before launch.

### 6.2 Marketplace law

- [ ] **Real Terms of Service** at `/terms`. Cover: marketplace non-party clause, commission disclosure (who pays, how much, when), dispute handling between restaurant and supplier, account termination, governing law (Serbia or Estonia for e-Residency setups).
- [ ] **P2B Regulation 2019/1150 compliance** (applies to marketplaces serving the EU regardless of where you are incorporated). Required:
  - Written terms with suppliers (lives in /terms)
  - Ranking transparency notice ("We rank by - latest joined / proximity / alphabetical")
  - Complaint-handling email address published in /terms
- [ ] **Disclaimer:** none of this is legal advice. Before paying users, get a lawyer in Serbia or the EU on the commission/payment-services question specifically. Holding or netting transaction funds may require a payment institution license; the safe pattern for pilot is invoicing software fees separately and never touching the principal.

### 6.3 Commission model decision (currently undefined)

`orders.commission_amt` is recorded on every order. Today: never billed, never invoiced. Three options to pick from before paying users:

1. **Software fee only** - flat monthly fee per supplier, invoiced via Stripe/Paddle. Commission column becomes informational. Lowest regulatory risk.
2. **Suppliers pay commission via separate invoice** at end of month. You list it in their dashboard. You bill via Stripe Invoicing. Higher operational lift.
3. **Hold funds and net commission** (restaurant pays you, you pay supplier minus cut). High regulatory risk in EU/Serbia. Probably needs a payment institution license. Avoid for pilot.

Recommendation: option 1 during pilot. Update `commission_pct` UI to say "Software fee included" rather than implying a transactional cut. Document the decision in `docs/operations/commission-model.md`.

### 6.4 Final copy and polish

- [ ] Verify Phase 1's marketing fixes are still in place (sometimes copy regresses during builds).
- [ ] **Remove `next-intl` from `package.json`** - unused dep is supply-chain surface for zero benefit.
- [ ] **OG image and favicon variants** - skip for pilot (no organic traffic); revisit on public launch.
- [ ] **Lint and typecheck clean**: `npm run lint`, add `"typecheck": "tsc --noEmit"` to scripts.

---

## 7. Risk register (revised)

| Risk | Likelihood | Impact | Mitigation phase |
|------|------------|--------|------------------|
| IDOR on UPDATE/DELETE actions leaks or wipes another tenant's data | Medium | Catastrophic | 2.1, 2.9 |
| Client-trusted pricing in `placeOrder` lets a buyer modify unit price to 0.01 | High | Catastrophic | 2.1 |
| Multi-supplier cart sequential place produces inconsistent state on partial failure | High | High | 2.3 |
| `placeOrder` non-transactional inserts leave ghost orders with zero items | Medium | High | 2.3 |
| Fabricated testimonials and stats trigger EU/Serbian consumer protection complaint | Medium | High | 2.7 |
| Missing DPA with Supabase = GDPR Article 28 breach from first EU user | Certain | High | 6.1 |
| No privacy notice at point of collection = Article 13 breach | Certain | Medium | 6.1 |
| Commission collected by data model but never billed = revenue leak + reconciliation chaos | Certain | High | 6.3 |
| `SUPABASE_SERVICE_ROLE_KEY` leak (added in Phase 1) | Low | Catastrophic | 5 (provisioning), ops hygiene |
| Restaurant can self-mark-paid = supplier trust collapse | Certain | High | 2.1 |
| Dead `/edit` route + missing settings page = pilot user churn | Certain | Medium | 3.2 |
| Pilot user hits an unhandled error and bounces | High without 3.1 | High | 3.1 + Sentry in 5 |
| Resend 100/day cap breached on a high-volume Monday | Medium | Medium | 4.2 |
| Vercel free-tier function invocations exhausted | Medium | Medium | 5 (upgrade to Pro) |
| Supabase free-tier egress exhausted by unpaginated browse | Medium | Medium | 3.5 + 5 (Pro) |
| "Verified suppliers" claim with no real verification = misrepresentation | Certain | Medium-High | 4.3 + 6.2 |
| Open redirect via reset-password `next=` param | Low | High | 2.5 |
| Email enumeration via auth error strings | Certain | Low | 2.4 |
| Stored XSS from unsanitized description/notes | Low | High | 2.6 (CSP) |
| Recurring order non-atomic update wipes items on partial failure | Low | High | 2.3 |
| P2B Regulation non-compliance reported by a disgruntled supplier | Low | Medium | 6.2 |

---

## 8. Drop list (intentionally not doing)

Items considered and rejected for pilot scope, with reason:

- **In-memory rate-limiter in proxy** - broken on Vercel serverless (per-instance state). If you need this, use Upstash; for pilot, Supabase's built-in auth rate limit is enough.
- **Sentry on `proxy.ts`** - hot path; bot scans burn free quota.
- **Per-section `error.tsx`** - root + global-error covers pilot failure modes.
- **Cookie banner** - planned analytics are cookieless.
- **Vercel Analytics / Plausible** - useless with < 50 known users.
- **Notifications bell UI** - email is enough; revisit when you have suppliers with > 50 daily events.
- **Product `textSearch` tsvector index** - client-side filter works at pilot catalog size.
- **OG image / favicon variants** - no organic traffic in pilot.
- **Comprehensive CI/CD** - Vercel git-push deploys are sufficient solo.
- **Test suite** - solo MVP; rely on TypeScript + Phase 2.9 RLS audit + manual smoke tests on every PR.
- **Stripe billing** - decide commission model first (Phase 6.3); billing arrives in v1 after pilot.
- **`next-intl` / i18n** - English-only for pilot; remove the dep.
- **Multi-user per company** - one user per `company_id` works for pilot.
- **Admin console** - manual SQL fine for < 50 users.
- **Audit log table** - Supabase logs are enough for pilot.

---

## 9. Phase sequencing

```
Day 1-5    Phase 1 (correctness + security + trust)
Day 6-10   Phase 2 (reliability + missing pages + UX)
Day 11-15  Phase 3 (pilot-essential features)
Day 16-17  Phase 4 (deploy + observability)
Day 18-20  Phase 5 (legal + business model + final copy)
Day 21     Soft launch to 1-3 friendly pilot users; iterate
```

Phases 1 and 2 are sequential because most Phase 2 UX work depends on Phase 1's `app_metadata` migration and the ownership-check pattern landing first. Phases 3 and 4 can interleave if you want to ship the deploy/observability pieces alongside feature work.

**Time-boxed alternative (1 week):** Phase 1 entirely + Phase 2.2 (missing pages) + Phase 2.7 marketing-already-done + Phase 4 (deploy). Skip Phase 3 entirely. Pilot with one supplier you onboard manually via SQL, products without images. Buys you the right to talk to one real customer without anything being legally or technically broken.

---

## 10. Next step

Pick one:

1. **Start executing Phase 1** - tell me to begin and I work through 2.1 → 2.10 with a verification gate after each subsection
2. **Adjust scope** - flag anything in this revised plan you want added, dropped, or reprioritized
3. **Deep-dive a specific area** before committing - e.g. "show me the Zod schema layer design" or "draft the `place_orders_atomic` RPC signature first"
