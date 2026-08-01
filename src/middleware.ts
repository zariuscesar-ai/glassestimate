import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// Public paths that never require a session.
const PUBLIC_PREFIXES = ['/login', '/signup', '/api/auth'];
const PUBLIC_EXACT = new Set(['/api/health', '/landing.html']);
const STATIC_FILE = /\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff2?|ttf|eot|pdf)$/i;

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

  // The marketing homepage on the public domain stays public — next.config
  // redirects glassestimate.app/ to /landing.html. Don't gate it.
  if (pathname === '/' && host.includes('glassestimate.app')) {
    return NextResponse.next();
  }

  // Everything else (app pages + data APIs) requires a valid session.
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
  return NextResponse.redirect(loginUrl);
}

// Run on everything except Next internals and image optimizer.
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
