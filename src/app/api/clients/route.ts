import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.clients.all(1)); // default company id 1; override via query
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await db.clients.insert({ ...body, company_id: body.company_id || 1 });
  return NextResponse.json(client, { status: 201 });
}
