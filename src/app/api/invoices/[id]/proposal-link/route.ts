import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : '';
}

// Ensure a public signing token exists and return the shareable /p/<token> URL.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const token = existing.public_token || crypto.randomBytes(16).toString('hex');
  await db.invoices.setPublicToken(parseInt(params.id), token);
  return NextResponse.json({ token, url: `${baseUrl(req)}/p/${token}` });
}
