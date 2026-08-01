// Server-side session helpers for Route Handlers (Node runtime). Reads the
// session cookie via next/headers and verifies it. Do NOT import from middleware.
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session';

/** Returns the verified session payload, or null if not signed in. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Returns the current company id for scoping queries, or null if unauthenticated.
 * Every data route uses this instead of a hardcoded company id.
 */
export async function currentCompanyId(): Promise<number | null> {
  const s = await getSession();
  return s ? s.cid : null;
}
