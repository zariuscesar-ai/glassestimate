import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 });
  const inv = await db.invoices.updateStatus(parseInt(params.id), status);
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inv);
}
