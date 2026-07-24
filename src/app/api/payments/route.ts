import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get('invoice_id');
  if (invoiceId) return NextResponse.json(db.payments.byInvoice(parseInt(invoiceId)));
  return NextResponse.json(db.payments.all());
}

export async function POST(req: Request) {
  const body = await req.json();
  const p = db.payments.insert(body);
  return NextResponse.json(p, { status: 201 });
}
