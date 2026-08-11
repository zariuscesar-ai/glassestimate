import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { applySubscriptionToCompany, resolveCompanyId } from '@/lib/billing-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe webhook. Keeps company subscription state in sync with Stripe as the
// source of truth (renewals, cancellations, payment failures). Requires the
// RAW request body for signature verification, so we read req.text().
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session;
        const companyId = await resolveCompanyId(cs as any);
        if (companyId && cs.subscription) {
          const subId = typeof cs.subscription === 'string' ? cs.subscription : cs.subscription.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          await applySubscriptionToCompany(companyId, sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const companyId = await resolveCompanyId(sub as any);
        if (companyId) await applySubscriptionToCompany(companyId, sub);
        break;
      }
      default:
        // Other events are acknowledged but ignored.
        break;
    }
  } catch (err) {
    // Log but still 200 so Stripe doesn't hammer retries on a transient error;
    // the next lifecycle event will re-sync state.
    console.error('[stripe/webhook] handler error', err);
  }

  return NextResponse.json({ received: true });
}
