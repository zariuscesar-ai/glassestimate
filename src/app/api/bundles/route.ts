import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Company-scoped catalog of "systems" (bundles) — glass wall systems, office
// partitions, storefronts, etc. Used by the estimate/invoice builders so a
// whole system style can be quoted by the linear foot, alongside raw materials.
export async function GET() {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json(await db.bundles.all(companyId));
}
