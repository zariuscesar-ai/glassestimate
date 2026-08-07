import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createResetToken } from '@/lib/reset-token';
import { sendEmail, resetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  if (email) {
    const user = await db.users.getByEmail(email);
    if (user) {
      const token = createResetToken(user.id, user.password_hash);
      const origin = process.env.APP_URL || new URL(req.url).origin;
      const link = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
      const { subject, html, text } = resetEmail(user.name, link);
      await sendEmail({ to: user.email, subject, html, text });
    }
  }
  return NextResponse.json({ ok: true });
}
