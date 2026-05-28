# Database Restructure Plan - ProcureLink

## Problem Statement

The current database has a split-identity problem: the `profiles` table stores a `role` field independently from the `company.type`, and they can get out of sync. For example, `supplier@gmail.com` has `role = "restaurant_owner"` but is linked to a supplier company ("Ocean Catch Seafood"). The middleware reads `role` to decide routing, so this user gets sent to the restaurant dashboard instead of the supplier dashboard.

Additionally there are redundant tables (`restaurant_profiles`, `supplier_profiles`) that add complexity without clear value - their fields can live directly on `companies`.

---

## Current Schema (Problems Highlighted)

### Tables to change

| Table | Problem |
|-------|---------|
| `profiles` | Stores `email` (redundant - already in `auth.users`), stores `role` (can conflict with `companies.type`), `company_id` is nullable and is the only link between user and entity |
| `restaurant_profiles` | Only has `cuisine_type` and `operating_hours` - these can be columns on `companies` |
| `supplier_profiles` | Has `currency`, `commission_pct`, `min_order_value`, etc. - these can be columns on `companies` |

### Tables to keep as-is

| Table | Status |
|-------|--------|
| `companies` | Good, but needs extra columns absorbed from restaurant/supplier profiles |
| `categories` | Fine |
| `products` | Fine |
| `orders` | Fine |
| `order_items` | Fine |
| `offers` | Fine |
| `delivery_slots` | Fine |
| `delivery_slot_exceptions` | Fine |
| `notifications` | Fine |
| `recurring_orders` | Fine |
| `recurring_order_items` | Fine |
| `recurring_order_runs` | Fine |

---

## Proposed Changes

### 1. Simplify `profiles` table

**Remove:** `email` column (get from `auth.users` when needed), `role` column

**Add:** nothing - the user's role is derived from `companies.type`:
- If `companies.type = 'supplier'` -> supplier user
- If `companies.type = 'restaurant'` -> restaurant user

**New `profiles` structure:**

```
profiles
  id          uuid PK (= auth.users.id)
  company_id  uuid FK -> companies.id (NOT NULL after onboarding)
  full_name   text
  avatar_url  text
  created_at  timestamptz
  updated_at  timestamptz
```

The role is **always** derived from `companies.type` via the `company_id` link. No more role/company-type mismatch possible.

### 2. Merge `restaurant_profiles` and `supplier_profiles` into `companies`

**Add to `companies`:**

From `supplier_profiles`:
- `currency` text DEFAULT 'EUR'
- `commission_pct` numeric DEFAULT 5
- `min_order_value` numeric
- `lead_time_hours` integer
- `delivery_zones` jsonb
- `certifications` text[]

From `restaurant_profiles`:
- `cuisine_type` text
- `operating_hours` jsonb

**Drop tables:** `restaurant_profiles`, `supplier_profiles`

### 3. Update `handle_new_user` trigger

Current trigger inserts `email` and `role` from `raw_user_meta_data`. New trigger should only insert `id` and `full_name`:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Update `get_my_role` function

Instead of reading `profiles.role`, derive it from the company type:

```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT c.type FROM public.profiles p
  JOIN public.companies c ON c.id = p.company_id
  WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 5. Update `complete_onboarding` function

Remove `restaurant_profiles`/`supplier_profiles` inserts. Instead set the new columns directly on `companies`:

```sql
-- Insert company with all fields
INSERT INTO public.companies (
  type, name, slug, address, city, postal_code, country, phone, email,
  currency, cuisine_type
)
VALUES (
  p_company_type, p_company_name, p_slug, p_address, p_city,
  p_postal_code, p_country, p_phone, p_email,
  p_currency, p_cuisine_type
)
RETURNING id INTO v_company_id;

-- Link profile (no role needed)
UPDATE public.profiles SET company_id = v_company_id WHERE id = v_user_id;
```

### 6. Update RLS policies

No structural RLS changes needed - `get_my_company_id()` still works. But `get_my_role()` now returns `'supplier'` or `'restaurant'` instead of `'supplier_admin'`/`'restaurant_owner'` etc.

### 7. Fix existing data

```sql
-- Fix supplier@gmail.com: their company is a supplier, so no role mismatch after migration
-- Just ensure company_id links are correct (they already are)

-- After migration, role is derived from company type, so:
-- supplier@gmail.com -> company "Ocean Catch Seafood" (type=supplier) -> supplier user
-- nikolamirilo@gmail.com -> company "La Bella" (type=restaurant) -> restaurant user
```

---

## Code Changes Required

### Middleware (`src/proxy.ts`)
- Instead of checking `profile.role`, check `companies.type` via a join or `get_my_role()`
- Route: `type = 'supplier'` -> `/supplier/dashboard`, `type = 'restaurant'` -> `/restaurant/dashboard`

### Auth actions (`src/lib/actions/auth.ts`)
- `signUp`: Remove `role` from `raw_user_meta_data` (or keep it temporarily for backward compat during migration)
- `completeOnboarding`: Set new columns on `companies` instead of creating `restaurant_profiles`/`supplier_profiles`

### Registration page (`src/app/(auth)/register/page.tsx`)
- User still picks "I'm a restaurant" or "I'm a supplier" during registration
- This value is stored as `company_type` preference in `raw_user_meta_data` (used only during onboarding to know which company type to create)

### All server actions that read `profile.role`
- Replace with `companies.type` via the `company_id` join
- Search for: `.select("role")`, `profile.role`, `get_my_role`

### TypeScript types (`src/lib/supabase/types.ts`)
- Remove `email`, `role` from `profiles`
- Add new columns to `companies`
- Remove `restaurant_profiles`, `supplier_profiles` tables
- Update `UserRole` type to just `'supplier' | 'restaurant'`

### Sidebar components
- Already derive the view from the URL path (`/supplier/*` vs `/restaurant/*`), so minimal change needed

---

## Migration Order

1. Add new columns to `companies` (non-breaking)
2. Copy data from `restaurant_profiles` and `supplier_profiles` into `companies`
3. Update `handle_new_user` trigger
4. Update `get_my_role`, `get_my_company_id`, `complete_onboarding` functions
5. Update RLS policies if any reference `profiles.role`
6. Deploy code changes (middleware, actions, types)
7. Drop `email` and `role` columns from `profiles`
8. Drop `restaurant_profiles` and `supplier_profiles` tables

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Existing users lose access | Migration copies all data first, then switches. Rollback = re-add columns |
| RLS breaks | `get_my_company_id()` is unchanged. Only `get_my_role()` changes return value |
| Onboarding breaks | Update code and function in same deploy |

---

## Summary

- **Drop 2 tables:** `restaurant_profiles`, `supplier_profiles`
- **Remove 2 columns:** `profiles.email`, `profiles.role`
- **Add 8 columns** to `companies` (from merged tables)
- **Update 3 functions:** `handle_new_user`, `get_my_role`, `complete_onboarding`
- **Root cause fix:** Role is derived from `companies.type`, never stored separately, so it can never go out of sync
