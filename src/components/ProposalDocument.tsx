'use client';

// Branded, printable proposal + standard contract + signature block.
// Shared by the dealer's in-app proposal page and the public signing link.

import { useState } from 'react';
import SignaturePad from './SignaturePad';
import { fillContract } from '@/lib/contract';

export interface ProposalItem { description: string; quantity: number; unit_price: number; amount: number; }
export interface ProposalInvoice {
  id: number; invoice_number: string; client_name?: string; issue_date: string; due_date: string;
  type: string; status: string; subtotal: number; tax_rate: number; tax_amount: number;
  discount_amount: number; shipping: number; total: number; notes?: string; terms?: string;
  items?: ProposalItem[];
  signature_data?: string; signed_by?: string; signed_at?: string; proposal_terms?: string; deposit_pct?: number;
}
export interface ProposalCompany {
  name?: string; logo?: string; address?: string; phone?: string; email?: string; website?: string; tax_id?: string;
  contract_terms?: string; default_deposit_pct?: number; warranty_months?: number; default_due_days?: number;
}

const money = (n: number) => '$' + (Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + (s.length <= 10 ? 'T00:00:00' : '')); return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); };

export default function ProposalDocument({ inv, company, onSign, busy }: {
  inv: ProposalInvoice; company: ProposalCompany;
  onSign?: (d: { signature_data: string; signed_by: string }) => void | Promise<void>;
  busy?: boolean;
}) {
  const [sig, setSig] = useState<string | null>(inv.signature_data || null);
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);

  const depositPct = Number(inv.deposit_pct ?? company.default_deposit_pct ?? 50) || 50;
  const depositAmount = Math.round(inv.total * depositPct) / 100;
  const balanceAmount = Math.round((inv.total - depositAmount) * 100) / 100;
  const warrantyMonths = Number(company.warranty_months ?? 12) || 12;
  const validDays = Number(company.default_due_days ?? 30) || 30;

  const contract = fillContract(inv.proposal_terms || company.contract_terms || '', {
    company: company.name || 'the Contractor', client: inv.client_name || 'the Customer',
    total: money(inv.total), depositPct, depositAmount: money(depositAmount), balanceAmount: money(balanceAmount),
    warrantyMonths, validDays,
  });

  const signed = !!inv.signed_at;
  const canSign = !!onSign && !signed;
  const submit = () => { if (sig && name.trim() && agree && onSign) onSign({ signature_data: sig, signed_by: name.trim() }); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          {company.logo && <img src={company.logo} alt="Logo" className="h-16 w-auto object-contain" />}
          <div>
            <h1 className="text-2xl font-bold">{company.name || 'Your Company'}</h1>
            {company.address && <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">{company.address}</p>}
            {company.phone && <p className="text-sm text-slate-500">Phone: {company.phone}</p>}
            {company.email && <p className="text-sm text-slate-500">{company.email}</p>}
            {company.website && <p className="text-sm text-slate-500">{company.website}</p>}
            {company.tax_id && <p className="text-xs text-slate-400 mt-1">License / Tax ID: {company.tax_id}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-slate-200">PROPOSAL</h2>
          <p className="text-sm text-slate-500 mt-1">{inv.invoice_number}</p>
          {signed
            ? <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">ACCEPTED</span>
            : <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Awaiting signature</span>}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide">Prepared for</p>
          <p className="font-medium">{inv.client_name || '—'}</p>
        </div>
        <div className="text-right">
          <p><span className="text-slate-500">Date: </span>{fmtDate(inv.issue_date)}</p>
          <p><span className="text-slate-500">Valid through: </span>{fmtDate(inv.due_date)}</p>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full mt-6 text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left text-slate-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right w-16">Qty</th>
            <th className="py-2 text-right w-28">Unit</th>
            <th className="py-2 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(inv.items || []).map((it, i) => (
            <tr key={i} className="border-b border-slate-100 align-top">
              <td className="py-2 pr-2 whitespace-pre-line">{it.description}</td>
              <td className="py-2 text-right">{it.quantity}</td>
              <td className="py-2 text-right">{money(it.unit_price)}</td>
              <td className="py-2 text-right">{money(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(inv.subtotal)}</span></div>
          {inv.discount_amount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{money(inv.discount_amount)}</span></div>}
          {inv.shipping > 0 && <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{money(inv.shipping)}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">Tax ({inv.tax_rate}%)</span><span>{money(inv.tax_amount)}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-1"><span>Total</span><span>{money(inv.total)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Deposit due ({depositPct}%)</span><span>{money(depositAmount)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Balance on completion</span><span>{money(balanceAmount)}</span></div>
        </div>
      </div>

      {inv.notes && <div className="mt-6 text-sm"><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Notes</p><p className="whitespace-pre-line text-slate-600">{inv.notes}</p></div>}

      {/* Contract */}
      <div className="mt-8">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Agreement</p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[12px] leading-relaxed text-slate-700 whitespace-pre-line max-h-none print:bg-white">{contract}</div>
      </div>

      {/* Signature */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Acceptance & signature</p>
        {signed ? (
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              {inv.signature_data && <img src={inv.signature_data} alt="Signature" className="h-20 w-auto object-contain border-b border-slate-300" />}
              <p className="text-sm font-medium mt-1">{inv.signed_by}</p>
              <p className="text-xs text-slate-500">Signed {fmtDate(inv.signed_at)}</p>
            </div>
            <div className="text-emerald-700 text-sm font-semibold">✓ Accepted</div>
          </div>
        ) : canSign ? (
          <div className="max-w-md no-print">
            <SignaturePad onChange={setSig} disabled={busy} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Type your full name"
              className="w-full mt-3 rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm" />
            <label className="flex items-start gap-2 mt-3 text-[12px] text-slate-600">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5" />
              <span>I have reviewed the proposal and agreement above and I approve it. I understand this signature is legally binding.</span>
            </label>
            <button type="button" onClick={submit} disabled={!sig || !name.trim() || !agree || busy}
              className="mt-4 w-full rounded-lg bg-emerald-600 text-white font-semibold px-4 py-2.5 hover:bg-emerald-700 disabled:opacity-50">
              {busy ? 'Submitting…' : '✍ Agree & Sign'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            <div className="border-b border-slate-300 h-12 w-64 mb-1" />
            <p>Customer signature &amp; date</p>
          </div>
        )}
      </div>
    </div>
  );
}
