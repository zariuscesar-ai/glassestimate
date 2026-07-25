import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const clientId = url.searchParams.get('client_id') || undefined;
  const type = url.searchParams.get('type') || 'invoice';
  return NextResponse.json(db.invoices.all(1, { status, search, client_id: clientId ? parseInt(clientId) : undefined, type }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { client_id, issue_date, due_date, items, notes, terms, tax_rate, discount_type, discount_value, shipping, type } = body;
  if (!client_id || !issue_date || !due_date || !items?.length) {
    return NextResponse.json({ error: 'Client, dates, and at least one item are required' }, { status: 400 });
  }
  const inv = db.invoices.insert(body.company_id || 1, {
    client_id: parseInt(client_id),
    issue_date,
    due_date,
    type: type || 'invoice',
    items,
    tax_rate: tax_rate ?? undefined,
    discount_type: discount_type || undefined,
    discount_value: discount_value ?? undefined,
    shipping: shipping ?? 0,
    notes: notes || undefined,
    terms: terms || undefined,
  });
  return NextResponse.json(inv, { status: 201 });
}
