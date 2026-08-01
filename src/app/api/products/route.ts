import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;
  return NextResponse.json(await db.products.all(1, { category, search }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const p = await db.products.insert({ ...body, company_id: body.company_id || 1 });
  return NextResponse.json(p, { status: 201 });
}
