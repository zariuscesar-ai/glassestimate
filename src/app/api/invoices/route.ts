import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const clientId = url.searchParams.get('client_id') || undefined;
  const type = url.searchParams.get('type') || 'invoice'; // 'invoice' or 'estimate'
  return NextResponse.json(db.invoices.all(1, { status, search, clientId: clientId ? parseInt(clientId) : undefined, type }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { client_id, issue_date, due_date, items, notes, terms, tax_rate, discount_type, discount_value, shipping, type } = body;

  if (!client_id || !issue_date || !due_date || !items?.length) {
    return NextResponse.json({ error: 'Client, dates, and at least one item are required' }, { status: 400 });
  }

  const company = db.companies.getById(body.company_id || 1);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 400 });

  const prefix = company.invoice_prefix || (type === 'estimate' ? 'EST-' : 'INV-');
  const nextNum = company.invoice_next_number || 1;
  const number = `${prefix}${String(nextNum).padStart(4, '0')}`;

  const rate = tax_rate ?? company.default_tax_rate;
  const discType = discount_type || 'none';
  const discValue = discount_value || 0;
  const ship = shipping || 0;

  let subtotal = 0;
  for (const item of items) subtotal += (item.quantity || 0) * (item.unit_price || 0);

  let discAmt = 0;
  if (discType === 'percent') discAmt = subtotal * (discValue / 100);
  else if (discType === 'fixed') discAmt = discValue;

  const afterDiscount = subtotal - discAmt;
  const taxAmt = afterDiscount * (rate / 100);
  const total = afterDiscount + taxAmt + ship;

  const inv = db.invoices.insert({
    company_id: body.company_id || 1,
    client_id,
    invoice_number: number,
    type: type || 'invoice',
    issue_date,
    due_date,
    status: 'draft',
    subtotal: Math.round(subtotal * 100) / 100,
    tax_rate: rate,
    tax_amount: Math.round(taxAmt * 100) / 100,
    discount_type: discType,
    discount_value: discValue,
    discount_amount: Math.round(discAmt * 100) / 100,
    shipping: ship,
    total: Math.round(total * 100) / 100,
    notes, terms,
    items: items.map((it: { product_id?: number; description: string; quantity: number; unit_price: number }) => ({
      product_id: it.product_id || null, description: it.description, quantity: it.quantity || 1, unit_price: it.unit_price || 0,
    })),
  });

  db.companies.update(company.id, { invoice_next_number: nextNum + 1 });

  return NextResponse.json(inv, { status: 201 });
}
