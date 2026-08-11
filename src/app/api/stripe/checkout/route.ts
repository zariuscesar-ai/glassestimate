import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { getStripe, planPriceId, stripeConfigured, type PlanId } from '@/lib/stripe';
import { appBaseUrl } from '@/lib/billing-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Start a Stripe Checkout Session for the signed-in company's chosen plan.
// Returns { url } for the browser to redirect to.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 503 });
  }

  const company = await db.companies.getById(session.cid);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const requested = body.plan as string | undefined;
  const plan: PlanId = (['showers', 'flat', 'both'].includes(requested || '') ? requested : (company.plan || 'both')) as PlanId;

  const price = planPriceId(plan);
  if (!price) {
    return NextResponse.json({ error: `The ${plan} plan is not configured. Set its Stripe price ID.` }, { status: 503 });
  }

  const stripe = getStripe();
  const base = appBaseUrl(req);

  try {
    // Reuse the company's Stripe customer if we have one; otherwise create it
    // now and remember it so future checkouts/portal sessions are stable.
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const user = await db.users.getById(session.uid);
      const customer = await stripe.customers.create({
        email: user?.email || company.email || undefined,
        name: company.name || undefined,
        metadata: { company_id: String(company.id) },
      });
      customerId = customer.id;
      await db.companies.update(company.id, { stripe_customer_id: customerId });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: String(company.id),
      subscription_data: { metadata: { company_id: String(company.id), plan } },
      allow_promotion_codes: true,
      success_url: `${base}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?canceled=1`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
