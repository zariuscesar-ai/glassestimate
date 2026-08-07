import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { readResetToken, passwordFingerprint } from '@/lib/reset-token';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = (body.token || '').trim();
  const password = body.password || '';
  if (!token) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  const payload = readResetToken(token);
  if (!payload) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  const user = await db.users.getById(payload.uid);
  if (!user || payload.fp !== passwordFingerprint(user.password_hash)) {
    return NextResponse.json({ error: 'This reset link is invalid or has already been used.' }, { status: 400 });
  }
  await db.users.updatePassword(user.id, hashPassword(password));
  return NextResponse.json({ ok: true });
}
