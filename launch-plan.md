# ProcureLink - Serbia Launch Plan

**Decision basis (locked with founder):**

- Language: Serbian default + English toggle (full next-intl wiring, Latin script)
- Launch target: Full public launch (hardened, billing, marketing, legal, analytics)
- Revenue model: Software fee - suppliers pay a flat monthly subscription. Platform never touches transaction funds. **Billing is NOT automated at launch: interested suppliers contact us to get on a plan; Paddle self-serve checkout is added later.**
- Currency: RSD + EUR (limited selector, RSD default)
- Deploy: Vercel + Supabase (Pro from day of first paying supplier)
- Team: Solo founder

This plan supersedes the English-only `plan.md`. It keeps that document's hardening work (which is correct) and layers on localization, billing, full Serbian/EU legal, and public-launch polish.

---

## 0. Inputs I need from you (not blockers, but I will stub them until provided)

These are business decisions or accounts only the founder can supply. I will build around placeholders and swap real values in when you hand them over.

1. **Legal entity.** Is ProcureLink a registered company (d.o.o. / preduzetnik) in Serbia with a PIB and APR registration, or operating under another structure (e.g. Estonian e-Residency OU)? Terms of Service, invoices, the privacy notice, and the Paddle seller account all depend on this. If not yet registered, the app can launch in closed beta but cannot bill until it is.
2. **Payment provider (deferred).** No automated billing at launch. Interested suppliers contact us and we set them up manually. When we do automate it: Stripe does not onboard Serbian businesses, so the plan is **Paddle** (merchant of record - handles VAT, invoicing, dunning). Nothing needed from you now.
3. **Pricing.** Monthly software fee per supplier, in RSD and EUR. Suggest one or two tiers (e.g. Basic / Pro) shown on the pricing section. Give me the numbers, or approve placeholders I propose in Workstream E. Prices are display-only at launch since billing is manual.
4. **Domain.** Production domain for Vercel + transactional email sender domain (for DNS / SPF / DKIM).
5. **Sender identity.** Support email and complaint-handling email (required by EU P2B regulation and to print on invoices/legal pages).
6. **Brand basics.** Confirm the name "ProcureLink" stays, or a Serbian-facing name. Logo asset if one exists.

---

## 1. Architecture snapshot (current state, verified)

- Next.js 16 (new `proxy.ts` middleware convention), React 19, Tailwind v4, shadcn UI.
- Supabase: auth + Postgres + RLS. DB restructure already shipped - role is derived from `companies.type`, `profiles` is slim, supplier/restaurant fields merged onto `companies`.
- Server actions for all writes (`src/lib/actions/*`). Transactional onboarding via `complete_onboarding` RPC. Recurring-order execution via `execute_recurring_orders` RPC.
- Two role-separated sections: `/restaurant/*` and `/supplier/*`. Features present: catalog browse, multi-supplier cart with order splitting, orders + status lifecycle, recurring orders ("automations"), delivery slots + calendar, offers, multi-currency.
- `next-intl` is installed but **completely unwired** - no message catalogs, no `useTranslations` calls. All UI is hardcoded English.

**Implication:** "Serbian-first" is a real build, not a setting. It is the single largest workstream and it touches every page, so we sequence it deliberately (infra early, translation sweep late) to avoid translating throwaway copy.

---

## 2. Workstreams and task list

Tasks are grouped by workstream. Each has a verification gate. I will track execution in the task list and check items off as I go.

### Workstream A - Security & write-path correctness (foundation, do first)

These are exploitable today. Nothing ships publicly until they are closed.

- [ ] A1. Add explicit ownership predicates to every `.update()`/`.delete()` in `orders.ts`, `products.ts`, `delivery.ts`, `recurring-orders.ts` (`.eq("supplier_id", ...)` / `.eq("restaurant_id", ...)` on top of RLS).
- [ ] A2. Re-derive prices, names, units server-side in `placeOrder` from `products` by id. Never trust client cart prices. Reject unavailable products or cross-supplier mismatches.
- [ ] A3. Reject `supplier_id` changes in `updateRecurringOrder`.
- [ ] A4. Remove `updatePaymentStatus` from the restaurant surface entirely (only supplier records payment).
- [ ] A5. Zod schema per server action in `src/lib/actions/schemas.ts`. Reject negatives, NaN, bad UUIDs, oversize strings. Server-side password length in `signUp`.
- [ ] A6. Atomic multi-supplier checkout: `place_orders_atomic(payload jsonb)` PL/pgSQL RPC with client-generated idempotency key (unique-indexed). Replaces the per-supplier loop in `cart/page.tsx`.
- [ ] A7. Atomic `update_recurring_order_atomic` RPC (current delete-then-insert is non-transactional).
- [ ] A8. Cache `role` + `company_id` in `auth.users` `app_metadata` (written in `complete_onboarding`, `SECURITY DEFINER`). Read from JWT in `proxy.ts` and server actions instead of an extra `profiles` lookup per request. Migrate `onboarding/page.tsx` read from `user_metadata` to `app_metadata`.
- [ ] A9. Generic auth error messages (no account-enumeration via "User already registered" vs "Invalid login").
- [ ] A10. Guard every server component / layout: explicit redirect instead of `user!.id`.
- [ ] A11. Whitelist `/api/*` in `proxy.ts` public routes (for health check). Open-redirect guard on reset-password `next=` param.
- [ ] A12. Security headers in `next.config.ts`: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and a CSP that allows Supabase + Sentry (add Paddle later when integrated). Verify server actions still work under CSP in preview.
- [ ] A13. DB indexes: write and run `docs/sql/indexes.sql` (orders by tenant+status / +date, products by supplier+available, order_items by order, notifications unread, recurring next_run, companies type+verified).
- [ ] A14. RLS write audit: `docs/sql/rls-audit.sql` asserting cross-tenant UPDATE/DELETE return 0 rows and cross-tenant INSERT is rejected. Run against staging, save results.
- [ ] A15. Confirmation modals on: Place Order, every order status transition, supplier Mark Paid, cancel/delete of confirmed orders / recurring orders / products.

**Gate:** RLS audit passes; manual IDOR probe with two accounts fails to cross tenants; price-tampering on checkout rejected.

### Workstream B - Localization infrastructure (do second, before page work)

Set the i18n foundation so all later page work uses keys, not hardcoded English.

- [ ] B1. Wire `next-intl` with cookie-based locale (no URL prefix - keeps `/supplier/...` clean). Default locale `sr`, fallback `en`. Request config + provider in root layout. Set `<html lang>` dynamically.
- [ ] B2. Create `messages/sr.json` and `messages/en.json` with a namespaced key structure (common, auth, onboarding, nav, landing, restaurant, supplier, orders, products, recurring, delivery, billing, legal, errors, toasts).
- [ ] B3. Localize `src/lib/constants.ts`: order statuses, payment statuses, product units, days of week, automation statuses become translation keys (keep stable enum values in the DB; translate only labels).
- [ ] B4. Locale-aware formatting helpers: dates via `date-fns` `sr` locale; currency/number via `Intl.NumberFormat` for RSD and EUR (RSD has no decimals by convention, EUR has two - handle both).
- [ ] B5. Language switcher component (in `mobile-header`, both sidebars, and the public nav). Persists choice to cookie.
- [ ] B6. Localize `metadata` (title/description) per locale; default Serbian.

**Gate:** App renders in both locales; switching toggles every wired string; default load is Serbian.

### Workstream C - Missing pages & reliability (build with i18n keys from the start)

- [ ] C1. `src/app/error.tsx`, `global-error.tsx`, root `not-found.tsx`, and `loading.tsx` skeletons in `restaurant/`, `supplier/`, and list pages.
- [ ] C2. `restaurant/automations/[id]/edit/page.tsx` - currently a dead link (404).
- [ ] C3. Order detail pages both roles: `restaurant/orders/[id]/page.tsx`, `supplier/orders/[id]/page.tsx` (full items, notes, status history, contact info, order number).
- [ ] C4. Company settings pages both roles: `restaurant/settings/page.tsx`, `supplier/settings/page.tsx` (edit address, phone, email, cuisine / currency / lead time). Today a typo at onboarding strands the user.
- [ ] C5. Supplier public profile: `restaurant/suppliers/[id]/page.tsx` (name, verified badge + disclosure, address, phone, their products).
- [ ] C6. Password reset flow: `/forgot-password`, `/auth/callback`, `/reset-password`, wired to Supabase, with the open-redirect guard. Email-verification UX (check-inbox page + callback to onboarding).
- [ ] C7. Real empty states with CTAs on all list pages; supplier "set up your storefront" nudge (add product, set slots, request verification); restaurant browse empty state with region email-capture.
- [ ] C8. Delivery date picker validates against active `delivery_slots` for the supplier's `day_of_week`; disable unavailable dates in the calendar.
- [ ] C9. Cart "Save as Recurring": replace query-string encoding (truncates large carts) with a server action that creates a draft `recurring_orders` row + items, then redirects to its edit page.
- [ ] C10. `useFormStatus` for submit state on register/login/onboarding (manual loading races React 19 transitions). `sonner` toasts on every server-action result; inline errors for validation only.
- [ ] C11. Mobile pass at 375px on every flow; fix the sidebar-as-sheet pattern where it breaks.

**Gate:** No dead links, no white screens; every flow completes on mobile; new pages render in both locales.

### Workstream D - Launch-essential product features

- [ ] D1. Product images: Supabase Storage bucket `product-images` with RLS (supplier writes own folder, authed read), MIME allowlist (jpg/png/webp), 2MB/file, 5/product. Upload UI in `product-form.tsx`; render in `product-browser.tsx` and supplier profile. Configure `next.config.ts` `images.remotePatterns`; set `unoptimized` or cap transformations to stay inside Vercel limits.
- [ ] D2. Transactional emails via Resend (Serbian + English templates by recipient locale): order placed -> supplier; order delivered/cancelled -> restaurant; recurring-order run failed -> restaurant owner. `src/lib/email/send.ts` + React Email templates. PII scrubber for later Sentry.
- [ ] D3. Real supplier verification: `supplier_verifications` audit table + `verified_at`/`verified_by` on `companies`. Verified badge + disclosure tooltip in browse and profile. Founder verification runbook in `docs/operations/verify-supplier.md`.
- [ ] D4. Notifications bell UI (in-app, reads `notifications` table) - included for a public launch since email alone is thin at scale. Mark-read, unread count, links to the relevant order/automation.

**Gate:** A supplier can list a product with images, get verified, and receive an order email; a restaurant sees the verified badge and gets delivery/cancel emails.

### Workstream E - Plans & "contact us" (no automated billing yet)

At launch there is no payment integration. Plans are presented; interested suppliers send us an inquiry; we onboard them manually. The data model is built now so Paddle drops in later with no rework.

- [ ] E1. Schema (forward-compatible): `subscription_plans` (name, price_rsd, price_eur, interval, features, is_public). `supplier_subscriptions` (company_id, plan_id, status, trial_ends_at, current_period_end, provider_customer_id nullable, provider_subscription_id nullable) - the provider columns sit empty until Paddle. Status enum: trialing / active / past_due / canceled. At launch the founder sets status manually via SQL/runbook.
- [ ] E2. Plans: propose Basic and Pro tiers in RSD and EUR (placeholder numbers for your approval), shown on the pricing section. Display-only for now.
- [ ] E3. Plan inquiry flow instead of checkout: each plan CTA opens a "Get this plan" form (`plan_inquiries` table or a transactional email to your support address) capturing company, contact, chosen plan, and message. Confirmation toast/email to the supplier. Runbook `docs/operations/onboard-paying-supplier.md` for manually activating them.
- [ ] E4. Feature gating (soft at launch): suppliers without an active/trialing subscription see a non-blocking "request a plan" banner and full functional access during the open-beta period. The gating switch is wired but set to permissive, so flipping to hard gating later is a one-line change once Paddle is live.
- [ ] E5. Billing settings page for suppliers: current plan / status / period end (manually managed for now), a "manage or request a plan - contact us" link, and a placeholder for invoice history. Update `commission_pct` UI language to "software fee" - the commission column becomes informational only.
- [ ] E6. (Later, out of scope now) Paddle: hosted checkout, webhook endpoint verifying signatures, billing portal, automatic status reconciliation, hard gating. Built behind a `BillingProvider` interface so the launch code does not change.

**Gate:** Pricing section shows the tiers; a plan CTA submits an inquiry we receive; suppliers retain access during beta; no payment code ships.

### Workstream F - Legal & compliance (Serbia + EU)

- [ ] F1. Sign the Supabase DPA (Article 28). Document processors: Supabase, Vercel, Resend, Paddle, Sentry, analytics.
- [ ] F2. Privacy Policy at `/privacy` in Serbian + English. Covers GDPR and Serbia's Zakon o zastiti podataka o licnosti (ZZPL), lawful basis (contract performance for B2B contact data), processor list, retention, data-subject rights, controller identity (your legal entity).
- [ ] F3. Privacy notice at point of collection (Article 13 / ZZPL): inline note on `register` and `onboarding` linking to the policy and naming processors.
- [ ] F4. Terms of Service at `/terms` in Serbian + English: marketplace non-party clause, software-fee disclosure (who pays, how much, when), restaurant<->supplier dispute handling, account termination, governing law (Serbia), and EU P2B Regulation 2019/1150 items - written supplier terms, ranking-transparency notice (state the browse sort order), published complaint-handling email.
- [ ] F5. Right-to-deletion: a settings button triggering account + cascading data deletion (`auth.admin.deleteUser` + cleanup), with confirmation.
- [ ] F6. Cookie posture: stay cookieless on analytics if possible (use a cookieless analytics tool) to avoid a consent banner; if not, add a compliant banner. Decide in Workstream H.
- [ ] F7. Serbian consumer-protection pass (Zakon o zastiti potrosaca / EU Omnibus): no fabricated stats, testimonials, ratings, or unqualified "verified"/"no hidden fees" claims anywhere. (Enforced in Workstream G.)

**Disclaimer baked into the plan:** I am not a lawyer. These documents will be solid, standards-based drafts using established marketplace templates, localized and specific to your data flows - but before you bill real users, have a Serbian lawyer review the ToS commission/payment-services and fiscalization questions. The software-fee model (never holding transaction funds) is specifically chosen to keep you out of payment-institution licensing territory.

### Workstream G - Marketing site & Serbian copy

- [ ] G1. Rewrite the landing page (`src/app/page.tsx`) in authentic Serbian (Latin), English mirror behind the toggle. Honest, no invented social proof.
- [ ] G2. Remove fabricated stats ("2,400+ restaurants", "850+", "1.2M", "99.9% SLA", "4.9/5 from 500+ reviews") and fabricated testimonials. Replace with honest milestones or a "private beta" framing until real proof exists.
- [ ] G3. Pricing section reflects the real software-fee tiers in RSD/EUR; fix the `$`/EUR currency-symbol mismatch; CTA opens the "Get this plan / contact us" inquiry form (no checkout yet).
- [ ] G4. Qualify or remove "verified suppliers" and "no hidden fees" until backed by real process/disclosure.
- [ ] G5. Footer legal links point to the real `/privacy` and `/terms` routes (no `#`).
- [ ] G6. SEO: Serbian-first metadata, OpenGraph image, favicon, `robots`, `sitemap`, hreflang for sr/en.

**Gate:** Nothing on the public surface is factually false; pricing matches billing; copy reads natively in Serbian.

### Workstream H - Deploy, observability, analytics

- [ ] H1. `.env.example` documenting every var (Supabase URL/anon, `SUPABASE_SERVICE_ROLE_KEY` marked server-only, `RESEND_API_KEY`, `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`; Paddle keys added later when billing is integrated).
- [ ] H2. Provision `SUPABASE_SERVICE_ROLE_KEY` in Vercel (production-scoped); document blast radius in README.
- [ ] H3. README rewrite: prereqs, local setup, Supabase setup, SQL migration order (restructure -> indexes -> RLS -> billing tables -> storage), deploy notes.
- [ ] H4. `src/app/api/health/route.ts` returning 200 only if a trivial Supabase read succeeds (path whitelisted in proxy).
- [ ] H5. Vercel: production = `main`, preview elsewhere, env vars in all environments, Node 22+, custom domain + HTTPS.
- [ ] H6. Sentry on server actions + `error.tsx` boundary only (not the proxy hot path); `beforeSend` scrubs email/password/phone.
- [ ] H7. Uptime monitor (UptimeRobot free) on `/api/health`.
- [ ] H8. Cookieless analytics (Plausible or Vercel Web Analytics) - keeps us out of cookie-banner territory (ties to F6).
- [ ] H9. Capacity note (`docs/operations/capacity.md`): free-tier ceilings (Supabase egress, Resend 100/day, Vercel functions + image transforms) and the upgrade trigger (Supabase Pro on first paying supplier).

**Gate:** Production build deploys green; health check + uptime monitor live; errors arrive in Sentry scrubbed.

### Workstream I - QA, translation sweep, and verification (last)

- [ ] I1. Full Serbian translation sweep: every key in `messages/sr.json` filled with native B2B Serbian; English mirror complete. No leftover English in the Serbian UI, no missing-key warnings.
- [ ] I2. `npm run lint` clean; add `"typecheck": "tsc --noEmit"` and pass it; production `next build` passes.
- [ ] I3. Manual smoke test of every end-to-end flow in BOTH locales on desktop and mobile: register -> verify -> onboard -> (supplier: add product+image, set slots, get verified, receive order, mark statuses, see billing) / (restaurant: browse, multi-supplier cart, checkout, recurring order, calendar, settings).
- [ ] I4. Independent verification pass via subagent: re-audit IDOR/price-tamper, confirm CSP doesn't break server actions, confirm billing webhook signature check, confirm no fabricated marketing claims remain, confirm legal links resolve.
- [ ] I5. Respect repo rule: no long dashes anywhere in shipped content (use "-").

**Gate:** Build green, both locales clean, security re-audit passes, founder sign-off.

---

## 3. Sequencing

```
Stage 1  Workstream A (security/correctness)      <- unblocks everything, do first
Stage 2  Workstream B (i18n infrastructure)       <- so later UI uses keys
Stage 3  Workstream C (missing pages/reliability) + D (features) in parallel-ish
Stage 4  Workstream E (billing)
Stage 5  Workstream F (legal) + G (marketing copy) together
Stage 6  Workstream H (deploy/observability)
Stage 7  Workstream I (translation sweep + full QA + verification)
Stage 8  Soft launch -> monitor -> iterate
```

Rationale: security first because the rest builds on the corrected write-path and `app_metadata` auth pattern. i18n infra before page work so we never hardcode English we will rip out. Translation sweep is deliberately last - we translate once, against final copy.

---

## 4. What I will NOT do (scope discipline)

- Hold or net transaction funds (keeps you clear of payment-institution licensing). Software fee only.
- Build a custom admin console - manual SQL + runbooks at launch scale.
- Multi-user-per-company, in-app chat, or a mobile app - post-launch.
- Any payment integration at launch - plans are display-only with a contact-us inquiry; Paddle is added later.
- A test suite beyond typecheck + RLS audit + the manual/subagent QA pass (solo founder tradeoff; revisit once there is revenue to justify it).

---

## 5. Next step

Approve this plan (or tell me what to add/drop/reprioritize) and I will start at Workstream A and work down, checking off the task list and stopping at each gate to report. Where I hit one of the Section 0 inputs (entity, Paddle account, pricing, domain), I will stub it and keep moving, flagging clearly what needs your real value before public launch.
