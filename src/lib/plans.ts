// Launch plan tiers. Display-only: billing is manual (contact-us) until Paddle
// is wired. Prices mirror docs/sql/007_subscriptions.sql. Feature labels are
// translation keys under the "billing" namespace.
export interface Plan {
  code: string;
  name: string;
  priceRsd: number;
  priceEur: number;
  featureKeys: string[];
}

export const PLANS: Plan[] = [
  {
    code: "basic",
    name: "Basic",
    priceRsd: 2900,
    priceEur: 25,
    featureKeys: ["featureCatalog", "featureOrders", "featureSlots"],
  },
  {
    code: "pro",
    name: "Pro",
    priceRsd: 5900,
    priceEur: 49,
    featureKeys: [
      "featureCatalog",
      "featureOrders",
      "featureSlots",
      "featureSupport",
      "featureAnalytics",
    ],
  },
];
