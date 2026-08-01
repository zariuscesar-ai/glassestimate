import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, SEED_OWNER } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  let user = await db.users.getByEmail(email);

  // First-run bootstrap: if the datastore has no users yet (auth just shipped
  // onto the pre-existing single-company store), seed the Eagles Glass owner
  // login so the existing live data is reachable. Only hashes when truly empty.
  if (!user && SEED_OWNER.password && (await db.users.count()) === 0) {
    await db.tenants.bootstrapOwner({
      email: SEED_OWNER.email, name: SEED_OWNER.name, password_hash: hashPassword(SEED_OWNER.password),
    });
    user = await db.users.getByEmail(email);
  }

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createSessionToken(user.id, user.company_id);
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
