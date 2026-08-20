import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Sign a proposal on-site (dealer is logged in, hands the device to the client).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.signed_at) return NextResponse.json({ error: 'Already signed' }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const signature_data = String(body?.signature_data || '');
  const signed_by = String(body?.signed_by || '').trim();
  if (!signature_data.startsWith('data:image') || !signed_by) {
    return NextResponse.json({ error: 'A signature and name are required' }, { status: 400 });
  }
  const inv = await db.invoices.sign(parseInt(params.id), {
    signature_data, signed_by,
    proposal_terms: typeof body?.proposal_terms === 'string' ? body.proposal_terms : undefined,
    deposit_pct: typeof body?.deposit_pct === 'number' ? body.deposit_pct : undefined,
  });
  return NextResponse.json(inv);
}
