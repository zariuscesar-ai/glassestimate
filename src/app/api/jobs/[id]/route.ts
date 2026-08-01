import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const job = await db.jobs.getById(parseInt(params.id));
  if (!job || job.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.jobs.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const job = await db.jobs.update(parseInt(params.id), body);
  return NextResponse.json(job);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const existing = await db.jobs.getById(parseInt(params.id));
  if (!existing || existing.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await db.jobs.delete(parseInt(params.id));
  return NextResponse.json({ success: true });
}
