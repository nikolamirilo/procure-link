-- 008_ux_improvements.sql
-- Supports the UX improvement round (docs/ux-improvement-proposal.md):
--   1. orders.dispatched_at  - status timeline on the order detail page
--   2. orders.delivery_time  - structured preferred delivery time (was parsed
--                              out of the notes string with a regex)
--   3. product-images storage bucket + RLS policies for supplier uploads
-- All changes are additive and safe to run on a live database.

-- 1 + 2: order columns ------------------------------------------------------

alter table public.orders
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivery_time time;

comment on column public.orders.dispatched_at is
  'Set when the supplier marks the order dispatched (status timeline).';
comment on column public.orders.delivery_time is
  'Preferred delivery time chosen by the restaurant at checkout.';

-- 3: product images bucket ---------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read (browse pages render images for anonymous-cached requests too).
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Suppliers may write only inside their own company folder:
-- path convention: {company_id}/{product_id}-{timestamp}.{ext}
drop policy if exists "product_images_owner_insert" on storage.objects;
create policy "product_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] =
        coalesce(auth.jwt() -> 'app_metadata' ->> 'company_id', '')
  );

drop policy if exists "product_images_owner_update" on storage.objects;
create policy "product_images_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] =
        coalesce(auth.jwt() -> 'app_metadata' ->> 'company_id', '')
  );

drop policy if exists "product_images_owner_delete" on storage.objects;
create policy "product_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] =
        coalesce(auth.jwt() -> 'app_metadata' ->> 'company_id', '')
  );
