-- 009_offers_pricing.sql
-- Offers go live for restaurants: checkout applies active discounts
-- server-side and order lines remember what was charged vs. the list price.
--
--   1. order_items.original_unit_price / discount_pct - promo snapshot per
--      line. unit_price keeps holding the EFFECTIVE (charged) price, so all
--      existing totals/commission math stays valid.
--   2. Partial index for the active-offer lookup placeOrder does per checkout.
--
-- All changes are additive and safe on a live database.

alter table public.order_items
  add column if not exists original_unit_price numeric,
  add column if not exists discount_pct numeric;

comment on column public.order_items.original_unit_price is
  'List price at order time when a discount was applied (null = no promo).';
comment on column public.order_items.discount_pct is
  'Offer discount percentage applied to this line (null = no promo).';

create index if not exists idx_offers_product_active
  on public.offers (product_id, start_date, end_date)
  where is_active;

-- NOTE: overlapping offers per product are rejected at the application layer
-- (createOffer). If you ever want the database to enforce it too:
--   create extension if not exists btree_gist;
--   alter table public.offers add constraint offers_no_overlap
--     exclude using gist (product_id with =,
--                         daterange(start_date, end_date, '[]') with &&)
--     where (is_active);
