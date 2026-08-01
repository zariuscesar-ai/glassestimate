import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const inv = await db.invoices.getById(parseInt(params.id));
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const inv = await db.invoices.update(parseInt(params.id), { ...body, company_id: body.company_id || 1 });
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inv);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await db.invoices.delete(parseInt(params.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
