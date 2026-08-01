import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json(await db.clients.all(companyId));
}

export async function POST(req: Request) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const client = await db.clients.insert({ ...body, company_id: companyId });
  return NextResponse.json(client, { status: 201 });
}
