import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Always run per-request against the live datastore (never statically prerender).
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await db.companies.all());
}
