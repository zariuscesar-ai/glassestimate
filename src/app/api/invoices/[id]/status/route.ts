import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.invoices.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 });
  const inv = await db.invoices.updateStatus(parseInt(params.id), status);
  return NextResponse.json(inv);
}
