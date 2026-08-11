// Edge-safe subscription access check for middleware.
//
// middleware runs on the Edge runtime, so it CANNOT import lib/db.ts (uses
// node:fs) or lib/stripe.ts (bundles the Stripe SDK). This module reads the
// same single-JSON store blob directly from the Upstash REST API using fetch,
// and checks whether a company's subscription unlocks the app.
//
// Design: FAIL-OPEN. If the KV env is missing, the network hiccups, or the blob
// can't be parsed, we return `true` (allow) so a transient infra problem can
// never lock every shop out of the product. A shop is only ever *blocked* when
// we can positively read the store and see a non-exempt company without an
// active/trialing subscription.

const STORE_KEY = 'glassestimate:store:v1';
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

function kvEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function exemptCompanyIds(): Set<number> {
  const raw = process.env.BILLING_EXEMPT_IDS ?? '1';
  const ids = raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
  return new Set(ids.length ? ids : [1]);
}

interface MiniCompany {
  id: number;
  subscription_status?: string;
}

async function loadCompanies(): Promise<MiniCompany[] | null> {
  const env = kvEnv();
  if (!env) return null; // no KV (local dev) -> caller fails open
  const res = await fetch(`${env.url}/get/${encodeURIComponent(STORE_KEY)}`, {
    headers: { Authorization: `Bearer ${env.token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const outer = (await res.json()) as { result?: unknown };
  let raw: unknown = outer?.result;
  if (raw == null) return null; // store not yet written
  // @upstash/redis stores values JSON-stringified; the REST GET returns that
  // string in `result`. Parse (twice if double-encoded) into the store object.
  try {
    if (typeof raw === 'string') raw = JSON.parse(raw);
    if (typeof raw === 'string') raw = JSON.parse(raw);
  } catch {
    return null;
  }
  const store = raw as { companies?: MiniCompany[] };
  return Array.isArray(store?.companies) ? store.companies : null;
}

/**
 * Whether the given company id currently has access to the app.
 * Exempt companies (BILLING_EXEMPT_IDS, default "1") always pass without any
 * network call. Everyone else needs an active/trialing subscription. Any error
 * reading the store fails OPEN (returns true).
 */
export async function companyHasAccess(companyId: number): Promise<boolean> {
  if (exemptCompanyIds().has(companyId)) return true;
  try {
    const companies = await loadCompanies();
    if (!companies) return true; // fail open on any read/parse problem
    const company = companies.find((c) => c.id === companyId);
    if (!company) return true; // unknown -> don't lock out
    return ACTIVE_STATUSES.has(company.subscription_status || 'none');
  } catch {
    return true; // fail open
  }
}
