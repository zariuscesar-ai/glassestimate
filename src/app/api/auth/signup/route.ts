import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, isValidEmail } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const companyName = (body.companyName || '').trim();
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!companyName || !name || !email || !password) {
    return NextResponse.json({ error: 'Company name, your name, email, and password are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const existing = await db.users.getByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists. Try logging in.' }, { status: 409 });
  }

  const { company, user } = await db.tenants.create({
    companyName, name, email, password_hash: hashPassword(password),
  });

  const token = await createSessionToken(user.id, company.id);
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    company: { id: company.id, name: company.name },
  }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
