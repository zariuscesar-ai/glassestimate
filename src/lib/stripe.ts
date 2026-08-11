// Server-side Stripe helpers (Node runtime only — imports the Stripe SDK and
// reads secret env vars). NEVER import this from a Client Component or from
// middleware (Edge). The Edge-safe access check lives in ./access-edge.

import Stripe from 'stripe';
import type { CompanyRow } from './db';

export type PlanId = 'showers' | 'flat' | 'both';

let _stripe: Stripe | null = null;

/** Lazily construct the Stripe client so the app still builds/boots without a
 *  key set. Throws only when actually called without STRIPE_SECRET_KEY. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  return _stripe;
}

/** True once the environment has a Stripe secret key configured. */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Map each plan to its configured Stripe Price ID. */
export function planPriceId(plan: PlanId): string | undefined {
  switch (plan) {
    case 'showers': return process.env.STRIPE_PRICE_SHOWERS;
    case 'flat': return process.env.STRIPE_PRICE_FLAT;
    case 'both': return process.env.STRIPE_PRICE_BOTH;
    default: return undefined;
  }
}

/** Given a Stripe Price ID, resolve which plan it belongs to (for webhooks). */
export function planForPriceId(priceId: string | null | undefined): PlanId | undefined {
  if (!priceId) return undefined;
  if (priceId === process.env.STRIPE_PRICE_SHOWERS) return 'showers';
  if (priceId === process.env.STRIPE_PRICE_FLAT) return 'flat';
  if (priceId === process.env.STRIPE_PRICE_BOTH) return 'both';
  return undefined;
}

/** Company ids that never need a paid subscription (e.g. the Eagles Glass owner
 *  account). Defaults to company 1. Override with BILLING_EXEMPT_IDS="1,2,3". */
export function exemptCompanyIds(): Set<number> {
  const raw = process.env.BILLING_EXEMPT_IDS ?? '1';
  const ids = raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
  return new Set(ids.length ? ids : [1]);
}

export function isExemptCompany(companyId: number): boolean {
  return exemptCompanyIds().has(companyId);
}

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

/** Whether a company currently has access to the app: exempt, or holding an
 *  active/trialing subscription. Used by Node route handlers; the Edge
 *  middleware uses the mirror in ./access-edge. */
export function companyHasAccessNode(company: Pick<CompanyRow, 'id' | 'subscription_status'>): boolean {
  if (isExemptCompany(company.id)) return true;
  return ACTIVE_STATUSES.has(company.subscription_status || 'none');
}

/** The subscription status we consider "unlocked". */
export function isActiveStatus(status: string | undefined | null): boolean {
  return ACTIVE_STATUSES.has(status || '');
}
