import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  let list = await db.jobs.all(companyId);
  if (status) list = list.filter((j) => j.status === status);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const job = await db.jobs.insert({ ...body, company_id: companyId });
  return NextResponse.json(job, { status: 201 });
}
