import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const list = await db.showerEstimates.all(companyId);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = await db.showerEstimates.insert(companyId, {
    project_name: body.project_name, client_name: body.client_name,
    enclosures: body.enclosures, markup_pct: body.markup_pct, tax_pct: body.tax_pct,
    subtotal: body.subtotal, total: body.total, status: body.status,
  });
  return NextResponse.json(row, { status: 201 });
}
