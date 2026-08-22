// Node-only helpers shared by the Stripe route handlers: write a Stripe
// subscription's state back onto the company row, resolve which company a
// Stripe object belongs to, and compute the app's base URL for redirects.

import type Stripe from 'stripe';
import { db, type CompanyRow } from './db';
import { planForPriceId } from './stripe';

/** Absolute base URL for building Stripe success/cancel/return URLs. Prefers an
 *  explicit env var; falls back to the incoming request's forwarded host. */
export function appBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  try { return new URL(req.url).origin; } catch { return ''; }
}

function customerIdOf(v: string | { id: string } | null | undefined): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.id;
}

/** Persist a subscription's status/plan/period onto the owning company. */
export async function applySubscriptionToCompany(companyId: number, sub: Stripe.Subscription): Promise<void> {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = planForPriceId(priceId);
  const update: Partial<CompanyRow> = {
    stripe_customer_id: customerIdOf(sub.customer as any),
    stripe_subscription_id: sub.id,
    subscription_status: sub.status as CompanyRow['subscription_status'],
    current_period_end: (sub as any).current_period_end,
  };
  if (plan) update.plan = plan;
  await db.companies.update(companyId, update);
}

/** Resolve which company a Stripe object (checkout session or subscription)
 *  belongs to: prefer an explicit company_id in metadata / client_reference_id,
 *  then fall back to a stored Stripe customer id. */
export async function resolveCompanyId(obj: {
  metadata?: Stripe.Metadata | null;
  client_reference_id?: string | null;
  customer?: string | { id: string } | null;
}): Promise<number | null> {
  const metaRaw = obj.metadata?.company_id ?? obj.client_reference_id ?? undefined;
  const metaId = metaRaw != null ? parseInt(String(metaRaw), 10) : NaN;
  if (Number.isFinite(metaId)) return metaId;
  const customer = customerIdOf(obj.customer as any);
  if (customer) {
    const c = await db.companies.getByStripeCustomer(customer);
    if (c) return c.id;
  }
  return null;
}
