import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUBLIC (no auth) — a customer views and signs their own proposal by token.
function trimCompany(c: Awaited<ReturnType<typeof db.companies.getById>>) {
  if (!c) return null;
  return {
    name: c.name, logo: c.logo, address: c.address, phone: c.phone, email: c.email, website: c.website,
    tax_id: c.tax_id, contract_terms: c.contract_terms, default_deposit_pct: c.default_deposit_pct,
    warranty_months: c.warranty_months, default_due_days: c.default_due_days,
  };
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const inv = await db.invoices.getByPublicToken(params.token);
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const company = await db.companies.getById(inv.company_id);
  return NextResponse.json({ invoice: inv, company: trimCompany(company) });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const inv = await db.invoices.getByPublicToken(params.token);
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (inv.signed_at) return NextResponse.json({ error: 'Already signed' }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const signature_data = String(body?.signature_data || '');
  const signed_by = String(body?.signed_by || '').trim();
  if (!signature_data.startsWith('data:image') || !signed_by) {
    return NextResponse.json({ error: 'A signature and name are required' }, { status: 400 });
  }
  const signed = await db.invoices.sign(inv.id, {
    signature_data, signed_by,
    proposal_terms: typeof body?.proposal_terms === 'string' ? body.proposal_terms : undefined,
    deposit_pct: typeof body?.deposit_pct === 'number' ? body.deposit_pct : undefined,
  });
  return NextResponse.json({ ok: true, signed_at: signed?.signed_at, signed_by: signed?.signed_by });
}
