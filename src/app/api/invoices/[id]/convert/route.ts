import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const estimate = await db.invoices.convertToInvoice(parseInt(params.id));
  if (!estimate) return NextResponse.json({ error: 'Not found or already converted' }, { status: 400 });
  return NextResponse.json(estimate);
}
