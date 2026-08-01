// Password hashing (Node runtime only — uses node:crypto scrypt). Do NOT import
// this from middleware (Edge runtime); import ./session there instead.
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

/** Hash a plaintext password. Returns "salt:hash" (hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

/** Verify a plaintext password against a stored "salt:hash". */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, KEYLEN);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// Bootstrap owner for the pre-existing single-company store (Eagles Glass).
// The password is read from an environment variable so it is NEVER committed to
// the (public) repo. Set SEED_OWNER_PASSWORD in Vercel; the first login after
// auth ships creates this owner account for the existing Eagles Glass data.
// If SEED_OWNER_PASSWORD is unset, no seed login is created (see AUTH-SETUP.md).
export const SEED_OWNER = {
  email: process.env.SEED_OWNER_EMAIL || 'zariuscesar@yahoo.com',
  name: process.env.SEED_OWNER_NAME || 'Zarius',
  password: process.env.SEED_OWNER_PASSWORD || '',
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
