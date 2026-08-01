// Edge-safe session token utilities (Web Crypto only — no node:crypto, no
// next/headers). Safe to import from middleware (Edge runtime) AND from Node
// route handlers. Password hashing lives in ./auth (Node-only); reading the
// cookie in a route handler lives in ./auth-server.

export const SESSION_COOKIE = 'ge_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: number; // user id
  cid: number; // company id
  iat: number; // issued-at (seconds)
  exp: number; // expiry (seconds)
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  // Fallback keeps the app running if AUTH_SECRET is unset, but sessions are
  // then signed with a well-known key = INSECURE. AUTH_SECRET must be set in
  // production (see AUTH-SETUP.md). We warn loudly rather than crash.
  if (typeof console !== 'undefined') {
    console.warn('[auth] AUTH_SECRET is not set or too short — using an insecure fallback. Set AUTH_SECRET in your environment.');
  }
  return 'insecure-dev-fallback-secret-change-me';
}

const encoder = new TextEncoder();

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesFromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(encoder.encode(str));
}

function stringFromB64url(s: string): string {
  return new TextDecoder().decode(bytesFromB64url(s));
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Create a signed session token for a user. */
export async function createSessionToken(uid: number, cid: number, maxAgeSec = SESSION_MAX_AGE): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, cid, iat, exp: iat + maxAgeSec };
  const body = b64urlFromString(JSON.stringify(payload));
  const sig = b64urlFromBytes(await hmac(body));
  return `${body}.${sig}`;
}

/** Verify a session token; returns the payload or null if invalid/expired. */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = b64urlFromBytes(await hmac(body));
  } catch {
    return null;
  }
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(stringFromB64url(body)) as SessionPayload;
    if (!payload || typeof payload.uid !== 'number' || typeof payload.cid !== 'number') return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
