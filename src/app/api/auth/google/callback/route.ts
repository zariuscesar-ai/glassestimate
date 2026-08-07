import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = process.env.APP_URL || url.origin;
  const savedState = req.cookies.get('g_oauth_state')?.value;
  const next = req.cookies.get('g_oauth_next')?.value || '/';
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
    res.cookies.delete('g_oauth_state'); res.cookies.delete('g_oauth_next');
    return res;
  };
  const err = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (err || !code) return fail('google-cancelled');
  if (!state || !savedState || state !== savedState) return fail('google-state');
  const clientId = process.env.GOOGLE_CLIENT_ID; const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('google-unconfigured');
  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  if (!tokenRes.ok) return fail('google-token');
  const tokens = await tokenRes.json().catch(() => ({}));
  if (!tokens.access_token) return fail('google-token');
  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileRes.ok) return fail('google-userinfo');
  const profile = await profileRes.json().catch(() => ({}));
  const email = (profile.email || '').trim().toLowerCase();
  if (!email || profile.email_verified === false) return fail('google-email');
  const user = await db.users.getByEmail(email);
  if (!user) return fail('google-no-account');
  const token = await createSessionToken(user.id, user.company_id);
  const dest = next.startsWith('/') ? next : '/';
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  res.cookies.delete('g_oauth_state'); res.cookies.delete('g_oauth_next');
  return res;
}
