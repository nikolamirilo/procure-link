-- Migration 001: order idempotency
-- Required by src/lib/actions/orders.ts (placeOrder). Apply before deploying
-- the hardened write path.
--
-- Adds a nullable idempotency key to orders and a partial unique index so a
-- retried / double-submitted checkout cannot create duplicate orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
