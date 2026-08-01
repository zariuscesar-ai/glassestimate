import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;
  return NextResponse.json(await db.products.all(companyId, { category, search }));
}

export async function POST(req: Request) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const p = await db.products.insert({ ...body, company_id: companyId });
  return NextResponse.json(p, { status: 201 });
}
