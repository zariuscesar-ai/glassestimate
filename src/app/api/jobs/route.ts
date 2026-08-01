import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  let list = await db.jobs.all(1);
  if (status) list = list.filter((j) => j.status === status);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const body = await req.json();
  const job = await db.jobs.insert({ ...body, company_id: 1 });
  return NextResponse.json(job, { status: 201 });
}
