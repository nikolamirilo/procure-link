-- Migration 004: transactional RPCs
--
-- These wrap multi-step writes in a single Postgres transaction (a function body
-- is atomic) and re-derive all prices server-side. They are the production-grade
-- replacements for the multi-step client logic in:
--   - placeOrder / the cart's per-supplier loop  -> place_orders_atomic
--   - updateRecurringOrder's delete+insert        -> update_recurring_order_atomic
--
-- The application currently calls the hardened TypeScript paths, which already
-- re-derive prices and roll back ghost orders. Switching the server actions to
-- these RPCs is the final step for full atomicity across a multi-supplier cart.

-- ---------------------------------------------------------------------------
-- place_orders_atomic: place one order per supplier group in a single tx.
-- p_payload shape (jsonb array):
-- [
--   {
--     "supplier_id": "uuid",
--     "delivery_date": "YYYY-MM-DD",
--     "delivery_slot_id": "uuid" | null,
--     "notes": "text" | null,
--     "idempotency_key": "uuid" | null,
--     "items": [ { "product_id": "uuid", "quantity": 3 }, ... ]
--   }, ...
-- ]
-- Returns: [ { "supplier_id", "order_id", "order_number" }, ... ]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_orders_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid := public.get_my_company_id();
  v_group         jsonb;
  v_item          jsonb;
  v_supplier      public.companies%ROWTYPE;
  v_product       public.products%ROWTYPE;
  v_order_id      uuid;
  v_order_number  text;
  v_subtotal      numeric;
  v_commission_pct numeric;
  v_qty           numeric;
  v_existing      uuid;
  v_idem          uuid;
  v_result        jsonb := '[]'::jsonb;
BEGIN
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'No company for current user';
  END IF;

  FOR v_group IN SELECT * FROM jsonb_array_elements(p_payload)
  LOOP
    -- Idempotency: return the existing order if this key already placed one.
    v_idem := NULLIF(v_group->>'idempotency_key', '')::uuid;
    IF v_idem IS NOT NULL THEN
      SELECT id INTO v_existing FROM public.orders WHERE idempotency_key = v_idem;
      IF v_existing IS NOT NULL THEN
        SELECT order_number INTO v_order_number FROM public.orders WHERE id = v_existing;
        v_result := v_result || jsonb_build_object(
          'supplier_id', v_group->>'supplier_id',
          'order_id', v_existing,
          'order_number', v_order_number);
        CONTINUE;
      END IF;
    END IF;

    SELECT * INTO v_supplier FROM public.companies
      WHERE id = (v_group->>'supplier_id')::uuid AND type = 'supplier';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supplier % not found', v_group->>'supplier_id';
    END IF;

    v_subtotal := 0;
    v_order_number := 'PL-' || to_char(now(), 'YYYYMMDD') || '-' ||
                      upper(substr(md5(random()::text), 1, 4));

    INSERT INTO public.orders (
      order_number, restaurant_id, supplier_id, delivery_slot_id, delivery_date,
      notes, currency, subtotal, tax, commission_pct, commission_amt, total,
      idempotency_key
    ) VALUES (
      v_order_number, v_restaurant_id, v_supplier.id,
      NULLIF(v_group->>'delivery_slot_id', '')::uuid,
      (v_group->>'delivery_date')::date,
      NULLIF(v_group->>'notes', ''),
      v_supplier.currency, 0, 0, COALESCE(v_supplier.commission_pct, 5), 0, 0,
      v_idem
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_group->'items')
    LOOP
      v_qty := (v_item->>'quantity')::numeric;
      IF v_qty IS NULL OR v_qty <= 0 THEN
        RAISE EXCEPTION 'Invalid quantity';
      END IF;

      SELECT * INTO v_product FROM public.products
        WHERE id = (v_item->>'product_id')::uuid;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
      END IF;
      IF v_product.supplier_id <> v_supplier.id THEN
        RAISE EXCEPTION 'Product does not belong to supplier';
      END IF;
      IF v_product.is_available IS FALSE THEN
        RAISE EXCEPTION 'Product % is not available', v_product.name;
      END IF;

      INSERT INTO public.order_items (
        order_id, product_id, product_name, unit, unit_price, quantity, total_price
      ) VALUES (
        v_order_id, v_product.id, v_product.name, v_product.unit,
        v_product.price, v_qty, round(v_product.price * v_qty, 2)
      );

      v_subtotal := v_subtotal + round(v_product.price * v_qty, 2);
    END LOOP;

    v_commission_pct := COALESCE(v_supplier.commission_pct, 5);
    UPDATE public.orders
      SET subtotal = v_subtotal,
          total = v_subtotal,
          commission_amt = round(v_subtotal * v_commission_pct / 100, 2)
      WHERE id = v_order_id;

    v_result := v_result || jsonb_build_object(
      'supplier_id', v_supplier.id,
      'order_id', v_order_id,
      'order_number', v_order_number);
  END LOOP;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- update_recurring_order_atomic: update header + replace items in one tx.
-- Verifies ownership and that the supplier is unchanged. Re-derives item
-- prices from products. p_items: [ { "product_id", "quantity" }, ... ]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_recurring_order_atomic(
  p_id uuid,
  p_name text,
  p_supplier_id uuid,
  p_frequency text,
  p_schedule_days jsonb,
  p_delivery_offset_days int,
  p_start_date date,
  p_end_date date,
  p_notes text,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid := public.get_my_company_id();
  v_existing_supplier uuid;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_next timestamptz;
BEGIN
  SELECT supplier_id INTO v_existing_supplier FROM public.recurring_orders
    WHERE id = p_id AND restaurant_id = v_restaurant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring order not found';
  END IF;
  IF p_supplier_id <> v_existing_supplier THEN
    RAISE EXCEPTION 'Supplier of a recurring order cannot be changed';
  END IF;

  UPDATE public.recurring_orders SET
    name = p_name,
    frequency = p_frequency,
    schedule_days = p_schedule_days,
    delivery_offset_days = p_delivery_offset_days,
    start_date = p_start_date,
    end_date = p_end_date,
    notes = p_notes,
    updated_at = now()
  WHERE id = p_id;

  DELETE FROM public.recurring_order_items WHERE recurring_order_id = p_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item->>'product_id')::uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;
    IF v_product.supplier_id <> v_existing_supplier THEN
      RAISE EXCEPTION 'Product does not belong to supplier';
    END IF;

    INSERT INTO public.recurring_order_items (
      recurring_order_id, product_id, product_name, unit, unit_price, quantity
    ) VALUES (
      p_id, v_product.id, v_product.name, v_product.unit, v_product.price,
      (v_item->>'quantity')::numeric
    );
  END LOOP;

  v_next := public.compute_next_run_date(p_id);
  IF v_next IS NOT NULL THEN
    UPDATE public.recurring_orders SET next_run_at = v_next WHERE id = p_id;
  END IF;
END;
$$;
