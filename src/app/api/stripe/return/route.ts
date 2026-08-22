import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getStripe, stripeConfigured } from '@/lib/stripe';
import { appBaseUrl, applySubscriptionToCompany, resolveCompanyId } from '@/lib/billing-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe redirects here after a successful Checkout. We eagerly sync the new
// subscription onto the company (so access is granted immediately, without
// waiting for the webhook) and then send the user into the app.
export async function GET(req: Request) {
  const base = appBaseUrl(req);
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');

  const session = await getSession();
  if (!session) return NextResponse.redirect(`${base}/login`);
  if (!stripeConfigured() || !sessionId) return NextResponse.redirect(`${base}/billing`);

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });

    // Guard: the checkout must belong to the signed-in company.
    const companyId = (await resolveCompanyId(checkout as any)) ?? session.cid;
    if (companyId !== session.cid) return NextResponse.redirect(`${base}/billing`);

    const sub = checkout.subscription;
    if (sub && typeof sub !== 'string') {
      await applySubscriptionToCompany(companyId, sub);
    }
    return NextResponse.redirect(`${base}/?subscribed=1`);
  } catch (err) {
    console.error('[stripe/return]', err);
    return NextResponse.redirect(`${base}/billing?error=1`);
  }
}
