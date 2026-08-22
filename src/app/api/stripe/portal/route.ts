import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { getStripe, stripeConfigured } from '@/lib/stripe';
import { appBaseUrl } from '@/lib/billing-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Open the Stripe Billing Portal so a subscribed shop can manage its plan,
// payment method, or cancel. Returns { url }.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 503 });

  const company = await db.companies.getById(session.cid);
  if (!company?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet. Subscribe first.' }, { status: 400 });
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${appBaseUrl(req)}/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error('[stripe/portal]', err);
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 });
  }
}
