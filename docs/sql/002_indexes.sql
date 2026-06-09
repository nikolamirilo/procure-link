-- Migration 002: performance indexes
-- Safe to run repeatedly. Covers the hot query paths in the dashboards,
-- order lists, browse, calendar and the recurring-order scheduler.

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_status ON public.orders(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_placed ON public.orders(restaurant_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_delivery ON public.orders(restaurant_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_delivery ON public.orders(supplier_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier_available ON public.products(supplier_id, is_available);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_active_next ON public.recurring_orders(next_run_at) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_companies_type_verified ON public.companies(type, is_verified);
