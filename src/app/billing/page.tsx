'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// NOTE: this is a Client Component and MUST NOT import lib/stripe (which would
// pull the Stripe secret SDK into the browser bundle). Plans are described
// inline; the actual price IDs live only on the server.
const PLANS = [
  { id: 'showers', name: 'Showers', price: 49, blurb: 'Shower enclosure estimates', features: ['Shower estimator + configurations', 'Editable market rates', 'Branded printable quotes'] },
  { id: 'both', name: 'Both', price: 79, blurb: 'Showers + flat glass — best value', features: ['Everything in Showers', 'Everything in Flat Glass', 'One bill, ~19% off vs. separate'], best: true },
  { id: 'flat', name: 'Flat Glass', price: 49, blurb: 'Interior glass & storefronts', features: ['Estimates & invoices', 'Clients, products, jobs', 'Payments tracking'] },
];

const ACTIVE = new Set(['active', 'trialing']);

interface Me {
  user?: { name?: string; email?: string };
  company?: { id: number; name?: string; plan?: string; subscription_status?: string };
}

function Billing() {
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const status = me?.company?.subscription_status || 'none';
  const isActive = ACTIVE.has(status);
  const selectedPlan = me?.company?.plan || 'both';

  const subscribe = async (plan: string) => {
    setError('');
    setBusy(plan);
    try {
      const r = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy('');
    }
  };

  const manageBilling = async () => {
    setError('');
    setBusy('portal');
    try {
      const r = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.url) throw new Error(data.error || 'Could not open billing.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-slate-900">GlassEstimate</div>
          <div className="text-sm text-slate-500">
            {me?.company?.name ? <span className="mr-3">{me.company.name}</span> : null}
            <a href="/api/auth/logout" className="text-slate-500 hover:text-slate-700">Sign out</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Founding-pricing urgency banner */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center mb-8">
          <span className="font-semibold">Founding pricing</span> — lock in these rates for life. Prices go up at launch.
        </div>

        {params.get('canceled') && (
          <div className="rounded-lg bg-slate-100 text-slate-600 text-sm px-4 py-2 mb-6 text-center">
            Checkout canceled — you haven&apos;t been charged. Pick a plan whenever you&apos;re ready.
          </div>
        )}
        {(error || params.get('error')) && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 mb-6 text-center">
            {error || 'Something went wrong finishing checkout. Please try again.'}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-16">Loading…</div>
        ) : isActive ? (
          <div className="max-w-md mx-auto text-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Subscription {status}
              </div>
              <h1 className="text-xl font-bold text-slate-900">You&apos;re all set</h1>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                Your <span className="font-medium capitalize">{selectedPlan}</span> plan is active.
              </p>
              <Link href="/" className="block w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700">
                Go to the app
              </Link>
              <button onClick={manageBilling} disabled={busy === 'portal'}
                className="block w-full mt-3 rounded-lg border border-slate-300 text-slate-700 font-medium py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
                {busy === 'portal' ? 'Opening…' : 'Manage billing'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Choose your plan to get started</h1>
              <p className="text-slate-500 text-sm mt-1">Monthly, cancel anytime. Grandfathered at today&apos;s price.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3 items-start">
              {PLANS.map((p) => {
                const highlight = p.best;
                const preselected = p.id === selectedPlan;
                return (
                  <div key={p.id}
                    className={
                      'rounded-2xl bg-white p-6 shadow-sm border ' +
                      (highlight ? 'border-blue-500 ring-2 ring-blue-200 relative' : 'border-slate-200')
                    }>
                    {highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1">
                        Best value
                      </div>
                    )}
                    <div className="flex items-baseline justify-between">
                      <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                      {preselected && <span className="text-xs text-blue-600 font-medium">Your pick</span>}
                    </div>
                    <div className="mt-2 mb-1">
                      <span className="text-3xl font-bold text-slate-900">${p.price}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">{p.blurb}</p>
                    <ul className="space-y-1.5 mb-6">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-green-500 mt-0.5">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => subscribe(p.id)} disabled={Boolean(busy)}
                      className={
                        'w-full rounded-lg font-medium py-2.5 text-sm disabled:opacity-60 ' +
                        (highlight
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50')
                      }>
                      {busy === p.id ? 'Starting…' : `Subscribe to ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-8">
              Secure checkout by Stripe. You can change or cancel your plan anytime.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <Billing />
    </Suspense>
  );
}
