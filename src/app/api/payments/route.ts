import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCompanyId } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get('invoice_id');
  if (invoiceId) {
    const inv = await db.invoices.getById(parseInt(invoiceId));
    if (!inv || inv.company_id !== companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(await db.payments.byInvoice(parseInt(invoiceId)));
  }
  return NextResponse.json(await db.payments.allForCompany(companyId));
}

export async function POST(req: Request) {
  const companyId = await currentCompanyId();
  if (companyId == null) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const inv = await db.invoices.getById(parseInt(body.invoice_id));
  if (!inv || inv.company_id !== companyId) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  const p = await db.payments.insert(body);
  return NextResponse.json(p, { status: 201 });
}
