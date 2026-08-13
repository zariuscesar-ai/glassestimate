import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SHOWER_STYLES, FINISHES } from '@/lib/shower/types';
import type { EnclosureConfig } from '@/lib/shower/types';
import { layoutEnclosure, formatIn, panelSizeLabel } from '@/lib/shower/glass';
import { sendEmail, showerRequestEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUBLIC (no auth) — a customer self-serve shower request for one shop, keyed by
// the company slug. GET returns just the shop's brand; POST files the request.

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const company = await db.companies.getBySlug(params.slug);
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ company: { name: company.name, logo: company.logo } });
}

function baseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : '';
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const company = await db.companies.getBySlug(params.slug);
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const customer = {
    name: String(body?.customer?.name || '').trim(),
    email: String(body?.customer?.email || '').trim(),
    phone: String(body?.customer?.phone || '').trim(),
  };
  const projectName = String(body?.projectName || '').trim();
  const enclosures: EnclosureConfig[] = Array.isArray(body?.enclosures) ? body.enclosures : [];

  if (!customer.name || (!customer.email && !customer.phone)) {
    return NextResponse.json({ error: 'Please include your name and an email or phone.' }, { status: 400 });
  }
  if (!enclosures.length) {
    return NextResponse.json({ error: 'Add at least one enclosure.' }, { status: 400 });
  }

  const row = await db.showerEstimates.insert(company.id, {
    project_name: projectName || 'Website request',
    client_name: customer.name,
    enclosures,
    markup_pct: 0, tax_pct: 0, subtotal: 0, total: 0,
    status: 'request', customer, source: 'public',
  });

  // Best-effort email to the shop (no-op if BREVO_API_KEY is unset — still saved).
  const lines: string[] = [];
  enclosures.forEach((c, i) => {
    const style = SHOWER_STYLES.find((s) => s.id === c.style);
    const finish = FINISHES.find((f) => f.id === c.finish);
    lines.push(`${c.label || "Enclosure " + (i + 1)} — ${style ? style.name : ""} — ${c.thickness} ${c.glass}${finish ? `, ${finish.name}` : ""}`);
    layoutEnclosure(c).panels.forEach((p) => lines.push(`   ${p.label}: ${p.square ? `${formatIn(p.wTop)} x ${formatIn(p.hLeft)}` : panelSizeLabel(p)}`));
  });
  if (company.email) {
    const link = `${baseUrl(req)}/showers?id=${row.id}`;
    const msg = showerRequestEmail(company.name, customer, projectName, lines, link);
    sendEmail({ to: company.email, subject: msg.subject, html: msg.html, text: msg.text }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
