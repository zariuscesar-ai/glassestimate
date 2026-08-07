// Password-reset token utilities. Node runtime only (uses node:crypto).
// Single-use without server storage: the token is bound to a fingerprint of the
// user's CURRENT password hash, so once the password changes any old token dies.
import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_SEC = 60 * 60; // 1 hour
const PURPOSE = 'pwreset';

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  return 'insecure-dev-fallback-secret-change-me';
}
function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(data: string): string {
  return b64url(createHmac('sha256', secret()).update(data).digest());
}
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
export function passwordFingerprint(passwordHash: string): string {
  return sign(`${PURPOSE}:${passwordHash}`).slice(0, 16);
}
interface ResetPayload { uid: number; exp: number; fp: string; }
export function createResetToken(uid: number, passwordHash: string): string {
  const payload: ResetPayload = { uid, exp: Math.floor(Date.now() / 1000) + TTL_SEC, fp: passwordFingerprint(passwordHash) };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}
export function readResetToken(token: string | undefined | null): ResetPayload | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot); const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()) as ResetPayload;
    if (typeof payload.uid !== 'number' || typeof payload.fp !== 'string') return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}
