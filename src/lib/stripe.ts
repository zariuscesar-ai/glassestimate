import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeInstance;
}

/**
 * Pricing plans — keep in sync with Stripe dashboard.
 * Create these products + prices in Stripe first.
 */
export const PLANS = {
  flat: {
    id: "flat",
    name: "Flat Glass & Storefronts",
    priceCents: 4900, // $49/mo
    features: [
      "Photo-based visual estimator",
      "All systems & enclosure layouts",
      "Doors, sidelites & transoms",
      "Instant pricing & branded proposals",
      "E-signature & invoicing",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FLAT || "",
  },
  shower: {
    id: "shower",
    name: "Shower Glass",
    priceCents: 4900, // $49/mo
    features: [
      "7 shower styles supported",
      "Glass type & thickness options",
      "Hardware finish configurator",
      "Cutout & notch placement",
      "Itemized pricing breakdown",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SHOWER || "",
  },
  bundle: {
    id: "bundle",
    name: "Flat + Shower Bundle",
    priceCents: 7900, // $79/mo
    features: [
      "Everything in Flat Glass",
      "Everything in Shower Glass",
      "Multi-item project support",
      "Hardware & finish configurator",
      "Save $19/month",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;
