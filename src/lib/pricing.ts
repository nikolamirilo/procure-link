/**
 * Single source of truth for promo pricing. Both the UI previews and the
 * placeOrder trust boundary round through here, so the price a restaurant
 * sees is the price the server charges - to the cent.
 */

export interface ActiveOfferRow {
  product_id: string;
  discount_pct: number;
}

/** Effective unit price after an offer discount, rounded to 2 decimals. */
export function applyDiscount(price: number, pct?: number | null): number {
  if (!pct || pct <= 0) return price;
  return parseFloat((price * (1 - pct / 100)).toFixed(2));
}

/**
 * productId -> best (highest) active discount. Creation rejects overlapping
 * offers, so multiples per product shouldn't exist - this is defensive.
 */
export function bestDiscounts(offers: ActiveOfferRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of offers) {
    const pct = Number(o.discount_pct);
    if (pct > 0 && pct > (map.get(o.product_id) ?? 0)) {
      map.set(o.product_id, pct);
    }
  }
  return map;
}

/** Local-date string (YYYY-MM-DD) used to window active offers. */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
