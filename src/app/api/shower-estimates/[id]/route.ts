import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const row = await db.showerEstimates.getById(parseInt(params.id), companyId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = await db.showerEstimates.update(parseInt(params.id), companyId, {
    project_name: body.project_name, client_name: body.client_name,
    enclosures: body.enclosures, markup_pct: body.markup_pct, tax_pct: body.tax_pct,
    subtotal: body.subtotal, total: body.total, status: body.status,
  });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const ok = await db.showerEstimates.delete(parseInt(params.id), companyId);
  return NextResponse.json({ ok });
}
