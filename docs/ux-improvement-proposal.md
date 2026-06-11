# ProcureLink UI/UX Improvement Proposal

Date: 2026-06-10
Scope: full audit of every route, component, and server action in `src/`, both roles (restaurant, supplier), auth/onboarding, and the public landing page.

## 1. Summary

The app's foundation is good: clean visual language, a sensible sidebar-per-role layout, a strong 3-step onboarding wizard, idempotent checkout, and confirm dialogs + toasts in most mutation paths. The problems are not cosmetic - they are breaks and dead ends in the core loop:

> Restaurant orders -> Supplier notices and confirms -> Restaurant sees confirmation -> Restaurant reorders next week.

Every issue below is ranked by how badly it damages that loop. The top 6:

| # | Problem | Why it kills the flow |
|---|---------|----------------------|
| 1 | Supplier may never notice a new order (no nav badge, no polling, no notifications on mobile) | Orders sit in "pending", restaurants lose trust, loop dies |
| 2 | Cart is in-memory only - one refresh/tab close and it is gone | Building a 30-item B2B order takes minutes; losing it once is enough to churn |
| 3 | Partial checkout failure can create duplicate orders | Succeeded suppliers' items stay in cart; retry re-places them with a new idempotency key |
| 4 | Supplier offers are invisible to restaurants and never applied at checkout | Suppliers do work that has zero effect; full price always charged |
| 5 | Min order value and lead time exist in settings but are never shown or enforced | Restaurants place orders suppliers must manually reject |
| 6 | Landing page is 100% hardcoded Serbian; auth placeholders are mixed EN/SR | First impression contradicts the i18n promise of the whole app |

## 2. Guiding principle

The user asked for "simple, smooth, logical". Concretely that means:

1. Every action gives immediate, specific feedback (what happened, to which order/supplier).
2. No screen is a dead end - every state offers the obvious next step.
3. Information needed for a decision appears at the moment of decision (min order value belongs in the cart, not in supplier settings).
4. Never lose user work (cart, forms, drafts).
5. One concept = one place (status changes shouldn't live only on list pages).

---

## 3. P0 - Flow-breaking issues (fix before launch)

### 3.1 Supplier order awareness

Current behavior:
- `supplier-sidebar.tsx:16-27` defines no badge on "Orders", even though `SidebarNav` already supports `badge?: number` (used by restaurant cart).
- `notification-bell.tsx` renders only inside the desktop `<aside>`; `mobile-header.tsx` has no bell at all and its `NavItem` type has no badge field.
- The bell fetches once on mount - no polling, no Supabase realtime subscription.
- Orders page is `force-dynamic` but requires a manual browser refresh.

Proposal:
1. Add a pending-orders count badge to the supplier "Orders" nav item (server-fetch in `supplier/layout.tsx`, pass down; the count query already exists on the dashboard).
2. Add `NotificationBell` to `MobileHeader` and add badge support to its `NavItem`.
3. Subscribe to Supabase realtime on the `orders` table (filter: `supplier_id = company_id`) in the supplier layout; on insert, bump badge + fire a toast "New order ORD-123 from {restaurant}". Fall back to 60s polling if realtime is off.
4. Highlight pending rows in the order table (left border accent + "New" chip for orders placed < 24h ago and still pending).

Effort: S-M. Files: `supplier-sidebar.tsx`, `mobile-header.tsx`, `sidebar-nav.tsx`, `notification-bell.tsx`, `supplier/order-list.tsx`.

### 3.2 Cart persistence

Current behavior: `use-cart.tsx` is a plain `useState` context. Refresh, tab close, or session expiry wipes the cart. No warning either.

Proposal: hydrate/persist the cart to `localStorage` (key per company id), debounced on change, validated on load (drop products that no longer exist or became unavailable, with a small "2 items were removed because they are no longer available" notice). This is ~30 lines in `use-cart.tsx` and removes the single biggest data-loss risk in the app.

Optional later: server-side cart table so the cart follows the user across devices.

### 3.3 Checkout: partial failure and feedback

Current behavior (`cart/page.tsx`, `handlePlaceAllOrders`):
- Orders are placed sequentially per supplier. If any fail, errors are joined into one banner; the cart is left untouched, including items for suppliers that succeeded.
- Retry re-submits succeeded suppliers with a fresh `crypto.randomUUID()` idempotency key -> duplicate orders.
- On full success the user is dropped on the orders list with no confirmation of what was placed.

Proposal:
1. After each successful `placeOrder`, immediately call `clearSupplierItems(supplierId)` (the helper already exists in `use-cart.tsx`). Failed suppliers' items remain; the error banner then says exactly which supplier failed and why, and "Try again" only re-submits the failures. This is a one-line-per-success fix that eliminates the duplicate-order risk.
2. Replace the silent redirect with a confirmation step: success screen (or toast stack) listing each placed order number linking to its detail page. For multi-supplier checkouts show a per-supplier result list: "Placed ORD-101 (Mesara Petrovic)" / "Failed: Zelena Bašta - delivery not available on that day".
3. Show a brief order summary (items, dates, totals per supplier) above the Place Order button so the button is an informed confirmation - then no extra "are you sure" dialog is needed.

Effort: S. Files: `cart/page.tsx`, optionally a tiny `orders/placed` success view.

### 3.4 Offers: close the loop or cut the feature

Current behavior: suppliers create % discount offers (`supplier/offer-list.tsx`), but `grep` confirms zero references to offers anywhere in `src/app/restaurant` or `src/components/restaurant`, and `placeOrder` (`orders.ts:82-128`) derives prices only from `products`. Restaurants never see a discount and are always charged full price.

Proposal (pick one, do not ship the current state):
- A (recommended): surface active offers in browse - "-15%" badge on the product card, strikethrough original price, discounted price bold; apply the active offer price server-side in `placeOrder` (price derivation already re-reads the DB, so add an offers join); show "Offers" as a filter chip and a small "Active offers" strip at the top of browse.
- B (if A is too much before launch): hide the Offers nav item behind a feature flag until A is built. A visible feature that does nothing erodes supplier trust faster than a missing feature.

Effort: M for A (browse card, checkout pricing, order_items needs an `applied_offer` or discounted unit_price snapshot - it already snapshots prices, so mostly pricing logic), XS for B.

### 3.5 Enforce and surface min order value, lead time, delivery days

Current behavior: `min_order_value` and `lead_time_hours` are editable in supplier settings but never displayed to restaurants and never validated at checkout. Delivery-day validation exists server-side only; the date picker does grey out invalid days, but min/lead constraints surface as nothing at all.

Proposal:
1. In the cart's per-supplier section show a compact info row: "Min. order 5.000 RSD · Delivers Mon/Wed/Fri · Order 24h ahead". Data is one query away (cart already fetches `delivery_slots` per supplier).
2. Below-minimum: show a progress hint ("Add 1.200 RSD to reach this supplier's minimum") and disable Place Order for that supplier only.
3. Validate lead time in the date picker (disable dates closer than `lead_time_hours`) and re-validate in `placeOrder`.
4. Show the same info on the supplier profile page (`restaurant/suppliers/[id]`), which is currently barebones.

Effort: M. Files: `cart/page.tsx`, `delivery-date-picker.tsx`, `orders.ts`, `suppliers/[id]/page.tsx`.

### 3.6 Landing page and auth i18n

Current behavior:
- `src/app/page.tsx` (802 lines): no `useTranslations`/`getTranslations` at all; all copy hardcoded Serbian, despite the app having a working EN/SR switcher and `messages/en.json`.
- Mixed-language placeholders in auth/onboarding: "you@example.com", "123 Main St", "Belgrade", "Fresh Foods Co.", "info@kompanija.com" (register page, onboarding steps).
- Zod validation messages from `schemas.ts` surface in English even in the Serbian UI.
- Hardcoded strings in transactional paths: "Nova porudžbina ..." (`orders.ts:186`), "isporučena"/"otkazana" (`orders.ts:250`), "Cancelled by supplier" (`supplier/order-list.tsx:192`), "Nova automatizacija" (`recurring-orders.ts:194`).

Proposal: move landing copy into `messages/*.json` namespaces, localize placeholders, give Zod schemas translated message keys resolved at the action boundary, and translate the four hardcoded transactional strings using the recipient company's locale. Until then the EN toggle is a broken promise on the most public page.

Effort: M (mechanical but wide).

---

## 4. P1 - Flow redesigns per journey

### 4.1 First-run experience (both roles)

What exists today is a strong wizard (3 steps, progress rail, review summary, "skip optional" note) that then drops the user onto a dashboard of four zeros with generic quick-action tiles.

Proposal: replace the dashboard's empty state with a first-steps checklist that reflects real completion state and disappears when done:

- Supplier: 1) Add your first product 2) Set delivery days 3) Complete company contact info -> "You're visible to restaurants".
- Restaurant: 1) Browse suppliers 2) Place your first order 3) Save it as a weekly automation.

Each item links straight to the action with the relevant form open. This converts "what now?" into a 3-minute setup path and directly drives marketplace liquidity (suppliers without products and delivery days are dead listings).

Effort: M. One `OnboardingChecklist` component + 2-3 cheap count queries per dashboard.

### 4.2 Reorder - the missing core action

Restaurants buy nearly the same basket every week. Today the only path is: browse, search each product, re-add, re-pick dates. Nothing on the dashboard, orders list, or order detail supports repetition except full automations.

Proposal:
1. "Reorder" button on order detail and on each order row: loads that order's items into the cart (validating availability/price changes, with a diff notice: "Price of 2 items changed").
2. Dashboard widget "Order again": last 3 completed orders with one-click reorder.
3. Keep "Save as automation" as the upsell next to reorder ("You reordered this 3 times - automate it?").

Effort: S-M. This is the single highest-leverage UX addition in the app; it shortens the weekly job from ~5 minutes to ~20 seconds.

### 4.3 Browse -> cart

Current friction: all products render at once (no pagination), no sort, single-select category and supplier filters, no debounce on search, min qty shown but not explained, cart invisible on mobile while browsing (sidebar is `lg:` only).

Proposal:
1. Sort dropdown (name, price asc/desc, supplier) + multi-select filter chips. Keep it client-side until the catalog outgrows it, then server-paginate (cursor on name).
2. Mobile: sticky bottom cart bar ("12 items · 8.450 RSD · View cart") replacing the hidden sidebar - this is the standard pattern restaurants on phones expect.
3. Product card: clicking the supplier name should link to the supplier profile (it is plain text today; the profile page exists but is orphaned).
4. Debounce search at ~200ms and show result count while typing (already shows count - keep).
5. When an item is added, animate the cart badge (existing) and show qty stepper directly on the card (replace "Add" with [- 2 +]) so adjusting doesn't require the sidebar.

Effort: M.

### 4.4 Orders (restaurant)

Current friction: no filters/search/pagination, cancel exists only on the list (not detail), no status timeline, no live updates, payment status is a badge the restaurant can't influence or understand.

Proposal:
1. Status filter chips above the table (All / Pending / Active / Delivered / Cancelled) + free-text search on order number and supplier. Server-paginate at 25 rows.
2. Order detail: add the actions that exist on the list (Cancel while pending/confirmed, plus the new Reorder), and a vertical status timeline (placed -> confirmed -> dispatched -> delivered with timestamps; `delivered_at` already stored, add `confirmed_at`/`dispatched_at` columns or derive from a status-history table).
3. Replace the desktop-table-with-hidden-columns mobile experience with stacked cards on < md (order number, supplier, date, total, status, actions).
4. Realtime or 60s polling on status changes so a restaurant watching the page sees "confirmed" appear without refreshing.

Effort: M.

### 4.5 Automations

The feature is powerful but the entry path is broken and failures are silent:

- "Save as recurring" from cart creates a DB draft named "Nova automatizacija" (hardcoded SR) with `frequency: weekly` and empty `schedule_days` - invalid until manually fixed; abandoning the edit page leaves orphan drafts.
- No way to test-run; failed runs are visible only if the user opens the detail page; error text is truncated (`max-w-50 truncate`).
- Monthly schedules allow day 29-31 with no note about short months.

Proposal:
1. Change "Save as recurring" to navigate to `/automations/new?from=cart` with items passed via the existing `data=` param (the form already supports prefill) - create the DB row only on save. Deletes the orphan-draft problem entirely and makes the flow stateless.
2. In the form, default schedule to weekly + the weekday of the cart's chosen delivery date, and name it "{Supplier} - weekly" via translation. The user then mostly confirms instead of configures.
3. Add "Run now" on the automation detail (reuses the scheduled-run server path) - lets users validate before trusting it.
4. Failure surfacing: dashboard alert banner "1 automation failed yesterday - view", plus the existing email infra for a failure notice. Show full error text in an expandable row, not truncated.
5. Small guard: if monthly day > 28 is selected, show "Will run on the last day in shorter months" (and implement that fallback server-side).

Effort: M. Files: `cart/page.tsx`, `recurring-orders.ts`, `recurring-order-form.tsx`, `recurring-order-detail.tsx`, dashboard.

### 4.6 Supplier order handling

Current friction: the only negative action is destructive Cancel with a hardcoded reason; status buttons exist on the list but not the detail page; toasts are generic; no packing view.

Proposal:
1. Explicit Accept / Decline on pending orders. Decline opens a reason picker (out of stock, below minimum, can't deliver that day, other + free text); reason is stored (column exists) and shown to the restaurant in the order detail and the existing cancellation email.
2. Mirror the status action buttons on the order detail page (one concept, both places). The detail page is where the supplier reads items; making them walk back to the list to act is an unnecessary loop.
3. Specific toasts: "ORD-123 confirmed" instead of the button label.
4. "Print / packing list" button on order detail (simple print stylesheet) - kitchens and warehouses live on paper.
5. Group the list by status or default-filter to "Needs action" (pending first); a supplier's job is a queue, not an archive.

Effort: M.

### 4.7 Supplier products

Current friction: no images, no search/filter/pagination, no bulk actions, single bottom-line form error.

Proposal, in value order:
1. Product images (Supabase Storage, one image, square crop) - browse cards on the restaurant side are text-only today, which suppresses ordering. Show image in browse card, supplier table thumbnail, and order detail lines.
2. Search + availability filter + category filter on the product table; paginate at 25.
3. Bulk availability toggle (checkbox column + "Set available/unavailable") - seasonal suppliers toggle dozens at once.
4. Field-level validation messages under each input (Zod already returns structured issues; render them instead of one generic line).

Effort: M-L (images are the long pole; the rest is S each).

### 4.8 Delivery slots

Current friction: `updateDeliverySlot()` exists but no edit UI - suppliers must delete and recreate; `is_active` exists but there's no pause toggle; zone is free text restaurants never see.

Proposal: add Edit (pencil) opening the same dialog prefilled, add an active/paused switch per slot, and either surface zone text on the supplier profile + cart info row or drop the field for now. Also add the cutoff concept: a single `lead_time_hours` already exists on the company - enforce it (see 3.5) rather than adding per-slot cutoffs yet.

Effort: S.

### 4.9 Billing

Current friction: inquiry goes into a table, founder is never emailed (`billing.ts:41` TODO), the supplier gets no record, can re-submit endlessly, and feature lists are vague keys.

Proposal: send the founder email (infra exists), show "Request sent on {date} - we'll reply within 2 business days" state on the plan card instead of the button after submitting (dedupe per company+plan), list concrete plan features/limits, and show inquiry history on the billing page. Self-serve payments stay out of scope for launch (already planned via Paddle).

Effort: S.

### 4.10 Dashboards: from counters to actions

Both dashboards show four static counts and four navigation tiles - no answers to "what needs me now?".

Proposal:
- Restaurant: Next delivery card (date, supplier, items count - data already on calendar), Pending confirmations list, Failed automations alert, Order again widget (4.2).
- Supplier: Needs action queue (pending orders, oldest first, inline Confirm), Today's deliveries (from dispatched orders), and a 7-day order count/revenue mini-trend.

Effort: M. Reuses existing queries; mostly composition.

---

## 5. P2 - Cross-cutting polish

Navigation
- Add "Suppliers" directory page for restaurants (grid of supplier cards: name, city, verified badge, delivery days, product count, min order) - profile pages already exist but are orphaned; today you cannot answer "who can deliver to me on Sunday?".
- Breadcrumbs on nested routes (automations new/detail/edit, order detail).
- Use exact-or-prefix matching per item for the active nav state rather than blanket `startsWith` (latent collision risk).

Feedback and states
- Empty states should always include the next action: orders empty -> "Browse products" button; products empty -> "Add product"; automations empty state already has a header button, mirror it inline. (Several currently are bare text: `supplier/product-list.tsx:100`, `supplier/order-list.tsx:61`.)
- Unsaved-changes guard on settings and automation forms (`beforeunload` + route change).
- Currency change in supplier settings: warn that existing products keep their numeric price ("Prices will not be converted").
- Account deletion: require typing the company name; mention what is deleted; offer data export first.

Mobile
- Tables -> cards below md everywhere (restaurant orders, supplier orders, products).
- Date/time pickers: verify popover positioning in small viewports.
- Language/theme toggles are reachable on mobile only inside the burger menu - acceptable, but the notification bell must be in the header (3.1).

Accessibility
- Status badges rely on color alone - add icons (already partially done with status icons in some places) and ensure 4.5:1 contrast in both themes.
- Truncated names (`truncate` on product/supplier names) need `title` attributes.
- Calendar day cells: make the day a button and order chips links, not nested interactive content.

i18n hygiene
- Audit pass: `grep -rn "[žšćčđ]" src/ --include="*.tsx" --include="*.ts"` outside `messages/` should return zero UI strings. Wire it as a lint/CI check so it stays clean.

Visual consistency
- One date format helper used everywhere (today: "d. MMM yyyy.", "EEE d. MMM", "d. MMMM yyyy." coexist).
- Always render currency with amounts; orders mix bare numbers and currency strings.
- Order numbers: monospace everywhere or nowhere.

Calendar
- Extend beyond 30 days (month navigation already exists; just widen the query window or fetch per-month).
- Stop parsing delivery time out of the notes string with a regex (`extractDeliveryTime`) - add a `delivery_time` column written at checkout (3.3's structured time), keep the regex only as legacy fallback.
- Add automations' next runs to the calendar as ghost entries - "what is arriving" should include what will be auto-placed.

Auth polish
- Password visibility toggle + simple strength hint on register/reset.
- If email confirmation is enabled in Supabase, add a "check your inbox" screen between register and onboarding; if disabled, no change.

---

## 6. Suggested sequencing

| Phase | Items | Outcome |
|-------|-------|---------|
| 1 (days) | 3.2 cart persistence, 3.3 partial-failure fix, 3.1 badges + mobile bell, 3.4-B hide offers (until A), translate 4 hardcoded transactional strings | Core loop is safe: no lost carts, no duplicate orders, suppliers see orders |
| 2 (1-2 weeks) | 3.5 min/lead surfacing + enforcement, 4.2 reorder, 4.6 accept/decline + detail actions, 4.8 slot edit/pause, 4.9 billing inquiry state, 3.6 landing i18n | Flow feels professional end to end |
| 3 (2-4 weeks) | 3.4-A offers in browse + checkout, 4.7 product images + table tooling, 4.4 order filters/timeline, 4.5 automation redesign, 4.10 dashboards, 4.1 checklists | Marketplace depth: discovery, repetition, trust |
| 4 (ongoing) | Section 5 polish, suppliers directory, calendar upgrades, a11y, realtime everywhere | Refinement |

## 7. Quick wins (under ~1 hour each)

1. `clearSupplierItems(supplierId)` after each successful checkout call (`cart/page.tsx`).
2. localStorage persistence in `use-cart.tsx`.
3. Pending-count badge on supplier "Orders" nav item.
4. `NotificationBell` in `MobileHeader`.
5. Translate "Nova automatizacija", "Nova porudžbina ...", "isporučena/otkazana", "Cancelled by supplier".
6. CTA buttons in empty states (orders, products).
7. Supplier name on browse cards -> link to supplier profile.
8. Wire existing `updateDeliverySlot` to an edit dialog.
9. Show `min_order_value` line in the cart supplier section (display only; enforcement is Phase 2).
10. Password visibility toggle on auth forms.
11. `title` attributes on truncated names.
12. Specific success toasts with order numbers in supplier status changes.

## 8. What NOT to add yet

To protect "simple and smooth", explicitly defer: chat/messaging between parties (email + decline reasons cover launch needs), ratings/reviews (no liquidity yet to make them meaningful), multi-user team management, CSV exports, and per-slot cutoff times (company-level lead time is enough). Each adds surface area before the core loop is proven.

---

Appendix - key files referenced

- Cart state: `src/hooks/use-cart.tsx`; checkout: `src/app/restaurant/cart/page.tsx`; server: `src/lib/actions/orders.ts`
- Navigation: `src/components/{restaurant,supplier}/*-sidebar.tsx`, `src/components/shared/{sidebar-nav,mobile-header,notification-bell}.tsx`
- Browse: `src/components/restaurant/product-browser.tsx`; supplier profile: `src/app/restaurant/suppliers/[id]/page.tsx`
- Automations: `src/components/restaurant/recurring-order-*.tsx`, `src/lib/actions/recurring-orders.ts`
- Supplier orders: `src/components/supplier/order-list.tsx`; shared detail: `src/components/shared/order-detail.tsx`
- Products: `src/components/supplier/{product-list,product-form}.tsx`; offers: `src/components/supplier/offer-list.tsx`, `src/lib/actions/delivery.ts`
- Delivery slots: `src/components/supplier/delivery-slot-manager.tsx`
- Billing: `src/app/supplier/billing/page.tsx`, `src/components/supplier/plan-cards.tsx`, `src/lib/actions/billing.ts`
- Onboarding/auth: `src/app/(auth)/*`, `src/lib/actions/auth.ts`; landing: `src/app/page.tsx`
