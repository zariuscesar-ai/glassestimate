import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { hashPassword, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Change the signed-in user's password. Requires the current password (so a
// hijacked-but-idle session can't silently rotate credentials), enforces a
// minimum length, and persists the new scrypt hash via db.users.updatePassword.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = body.currentPassword || '';
  const newPassword = body.newPassword || '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 });
  }

  const user = await db.users.getById(session.uid);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (!verifyPassword(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  await db.users.updatePassword(user.id, hashPassword(newPassword));
  return NextResponse.json({ ok: true });
}
