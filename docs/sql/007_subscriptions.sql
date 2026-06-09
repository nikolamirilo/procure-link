-- Migration 007: plans, subscriptions, and plan inquiries
--
-- Billing is NOT automated at launch. Interested suppliers submit an inquiry
-- (plan_inquiries) and the founder activates them manually by inserting/updating
-- supplier_subscriptions. The provider_* columns stay null until Paddle is wired.

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  price_rsd   numeric NOT NULL,
  price_eur   numeric NOT NULL,
  interval    text NOT NULL DEFAULT 'month',
  is_public   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supplier_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_code               text,
  status                  text NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('trialing','active','past_due','canceled')),
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  provider_customer_id    text,
  provider_subscription_id text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  UNIQUE (company_id)
);

CREATE TABLE IF NOT EXISTS public.plan_inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  plan_code   text,
  contact_name text,
  contact_email text,
  message     text,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_inquiries        ENABLE ROW LEVEL SECURITY;

-- Plans are public-readable.
DROP POLICY IF EXISTS plans_read ON public.subscription_plans;
CREATE POLICY plans_read ON public.subscription_plans
  FOR SELECT USING (true);

-- A supplier may read only its own subscription row.
DROP POLICY IF EXISTS sub_read_own ON public.supplier_subscriptions;
CREATE POLICY sub_read_own ON public.supplier_subscriptions
  FOR SELECT USING (company_id = public.get_my_company_id());

-- A supplier may create an inquiry for its own company and read its own.
DROP POLICY IF EXISTS inquiry_insert_own ON public.plan_inquiries;
CREATE POLICY inquiry_insert_own ON public.plan_inquiries
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS inquiry_read_own ON public.plan_inquiries;
CREATE POLICY inquiry_read_own ON public.plan_inquiries
  FOR SELECT USING (company_id = public.get_my_company_id());

-- Seed the two launch tiers (display-only; edit the numbers as you like).
INSERT INTO public.subscription_plans (code, name, price_rsd, price_eur)
VALUES
  ('basic', 'Basic', 2900, 25),
  ('pro',   'Pro',   5900, 49)
ON CONFLICT (code) DO NOTHING;
