import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const estimate = db.invoices.convertToInvoice(parseInt(params.id));
  if (!estimate) return NextResponse.json({ error: 'Not found or already converted' }, { status: 400 });
  return NextResponse.json(estimate);
}
