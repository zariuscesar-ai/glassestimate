import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.APP_URL || url.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL('/login?error=google-unconfigured', origin));
  const next = url.searchParams.get('next') || '/';
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: 'code',
    scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account',
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };
  res.cookies.set('g_oauth_state', state, opts);
  res.cookies.set('g_oauth_next', next.startsWith('/') ? next : '/', opts);
  return res;
}
