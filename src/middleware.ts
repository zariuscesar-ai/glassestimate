import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { companyHasAccess } from '@/lib/access-edge';

// Public paths that never require a session.
const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth', '/showers/request', '/api/public'];
const PUBLIC_EXACT = new Set(['/api/health', '/landing.html']);
// Authenticated, but exempt from the subscription paywall — a signed-in shop
// with no active plan must still be able to reach these to actually subscribe.
const GATE_EXEMPT_PREFIXES = ['/billing', '/api/stripe'];
const STATIC_FILE = /\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff2?|ttf|eot|pdf)$/i;

function isGateExempt(pathname: string): boolean {
  return GATE_EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // Always-public: auth pages/endpoints, health check, static assets.
  if (
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    STATIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Resolve the session once (edge-safe HMAC check, no datastore hit).
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Homepage is auth-aware (this replaces the old next.config host redirect):
  //  - signed in  -> fall through to the subscription gate, then the dashboard
  //  - signed out on the public marketing domain -> the marketing landing page
  //  - signed out anywhere else -> the login page
  if (pathname === '/') {
    if (!session) {
      if (host.includes('glassestimate.app')) {
        return NextResponse.rewrite(new URL('/landing.html', req.url));
      }
      const homeLogin = req.nextUrl.clone();
      homeLogin.pathname = '/login';
      homeLogin.search = '';
      return NextResponse.redirect(homeLogin);
    }
  } else if (!session) {
    // Everything else (app pages + data APIs) requires a valid session.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
    return NextResponse.redirect(loginUrl);
  }

  // Signed in. Enforce the subscription paywall on the app itself; /billing and
  // /api/stripe are exempt so an unsubscribed shop can reach checkout. Exempt
  // companies (the Eagles Glass owner) and any KV/read error fail open — see
  // lib/access-edge.
  if (session && !isGateExempt(pathname)) {
    const hasAccess = await companyHasAccess(session.cid);
    if (!hasAccess) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'A subscription is required.', code: 'subscription_required' },
          { status: 402 },
        );
      }
      const billingUrl = req.nextUrl.clone();
      billingUrl.pathname = '/billing';
      billingUrl.search = '';
      return NextResponse.redirect(billingUrl);
    }
  }

  return NextResponse.next();
}

// Run on everything except Next internals and image optimizer.
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
