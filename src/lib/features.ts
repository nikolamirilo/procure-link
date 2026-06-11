/**
 * Feature flags. Flip these as features become production-ready.
 *
 * offers: live. Restaurants see discount badges in browse / supplier
 * profiles, the cart shows savings, and placeOrder applies active offers
 * server-side through the same lib/pricing helper the UI uses.
 */
export const FEATURES = {
  offers: true,
} as const;
