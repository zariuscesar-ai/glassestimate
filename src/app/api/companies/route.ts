import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Multi-tenant: only ever return the signed-in user's own company.
export async function GET() {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const company = await db.companies.getById(companyId);
  return NextResponse.json(company ? [company] : []);
}
