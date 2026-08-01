import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const inv = await db.invoices.getById(parseInt(params.id));
  if (!inv || inv.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const inv = await db.invoices.update(parseInt(params.id), { ...body, company_id: companyId });
  return NextResponse.json(inv);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await db.invoices.delete(parseInt(params.id));
  return NextResponse.json({ success: true });
}
