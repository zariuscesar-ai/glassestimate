'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Inv { id: number; invoice_number: string; client_name?: string; client_id: number; issue_date: string; due_date: string; status: string; subtotal: number; tax_rate: number; tax_amount: number; discount_type: string; discount_value: number; discount_amount: number; shipping: number; total: number; notes: string; terms: string; type: string; items?: { id: number; product_id: number | null; description: string; quantity: number; unit_price: number; amount: number; }[]; payments?: { id: number; amount: number; method: string; reference: string; payment_date: string; notes: string; }[]; }

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inv, setInv] = useState<Inv | null>(null);
  const [company, setCompany] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, method: 'Check', reference: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true); setError('');
    try {
      const [invRes, coRes] = await Promise.all([
        fetch(`/api/invoices/${params.id}`),
        fetch('/api/companies'),
      ]);
      if (!invRes.ok) { setError('Invoice not found.'); setLoading(false); return; }
      setInv(await invRes.json());
      if (coRes.ok) { const coData = await coRes.json(); setCompany(coData[0] || {}); }
    } catch (err) { console.error(err); setError('Could not load invoice.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoice(); }, [params.id]);

  const updateStatus = async (status: string) => {
    if (!inv) return;
    try {
      const res = await fetch(`/api/invoices/${params.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) setInv(await res.json());
    } catch { alert('Failed to update status.'); }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || payForm.amount <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payForm, invoice_id: inv!.id }) });
      if (!res.ok) { alert('Payment failed'); return; }
      await fetchInvoice();
      setShowPayment(false);
      setPayForm({ amount: 0, method: 'Check', reference: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
    } catch { alert('Payment failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
    router.push('/invoices');
  };

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };
  const badge = (s: string) => { const m: Record<string, string> = { draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid', overdue: 'badge-overdue', viewed: 'badge-viewed', cancelled: 'badge-cancelled' }; return m[s] || 'badge-draft'; };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading invoice...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={() => router.push('/invoices')} className="btn-primary">Back to Invoices</button></div>;
  if (!inv) return null;

  const totalPaid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
  const balance = inv.total - totalPaid;

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="btn-ghost btn-sm">&larr; Back</Link>
          <span className={badge(inv.status)}>{inv.status}</span>
        </div>
        <div className="flex gap-2">
          {inv.status === 'draft' && <button onClick={() => updateStatus('sent')} className="btn-primary btn-sm">Mark Sent</button>}
          {(inv.status === 'sent' || inv.status === 'draft') && <button onClick={() => updateStatus('paid')} className="btn-secondary btn-sm">Mark Paid</button>}
          <button onClick={window.print} className="btn-secondary btn-sm">Print</button>
          {inv.type === 'estimate' && <Link href={`/invoices/${inv.id}/proposal`} className="btn-primary btn-sm">📝 Proposal &amp; e-sign</Link>}
          {inv.type === 'estimate' && inv.status !== 'converted' && <button onClick={async () => { const res = await fetch(`/api/invoices/${params.id}/convert`, { method: 'POST' }); if (res.ok) { const newInv = await res.json(); router.push(`/invoices/${newInv.id}`); } else alert('Conversion failed'); }} className="btn-primary btn-sm">Convert to Invoice</button>}
          <Link href={`/invoices/${inv.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <button onClick={handleDelete} className="btn-ghost btn-sm text-red-600">Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-start gap-4">
            {company.logo && <img src={company.logo} alt="Logo" className="h-16 w-auto object-contain print:h-16" />}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name || 'Eagles Glass Inc'}</h1>
              {company.address && <p className="text-sm text-slate-500 mt-1">{company.address}</p>}
              {company.phone && <p className="text-sm text-slate-500">Phone: {company.phone}</p>}
              {company.email && <p className="text-sm text-slate-500">{company.email}</p>}
              {company.website && <p className="text-sm text-slate-500">{company.website}</p>}
              {company.tax_id && <p className="text-sm text-slate-400 mt-1">Tax ID: {company.tax_id}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slate-200">{inv.type === 'estimate' ? 'ESTIMATE' : 'INVOICE'}</h2>
            <p className="text-lg font-semibold text-slate-900 mt-1">{inv.invoice_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div><h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3><p className="font-semibold text-slate-900 text-lg">{inv.client_name}</p></div>
          <div className="text-right space-y-1">
            <div><span className="text-sm text-slate-500">Issue: </span><span className="text-sm font-medium">{inv.issue_date}</span></div>
            <div><span className="text-sm text-slate-500">Due: </span><span className="text-sm font-medium">{inv.due_date}</span></div>
            <div><span className="text-sm text-slate-500">Status: </span><span className="text-sm font-medium capitalize">{inv.status}</span></div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead><tr className="border-b-2 border-slate-300"><th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase w-12">#</th><th className="py-3 text-left text-xs font-semibold text-slate-400 uppercase">Description</th><th className="py-3 text-right text-xs font-semibold text-slate-400 uppercase w-20">Qty</th><th className="py-3 text-right text-xs font-semibold text-slate-400 uppercase w-28">Price</th><th className="py-3 text-right text-xs font-semibold text-slate-400 uppercase w-28">Amount</th></tr></thead>
          <tbody>
            {(inv.items || []).map((it, i) => (<tr key={it.id || i} className="border-b border-slate-200"><td className="py-3 text-sm text-slate-400">{i + 1}</td><td className="py-3 text-sm text-slate-900">{it.description}</td><td className="py-3 text-sm text-right">{it.quantity}</td><td className="py-3 text-sm text-right">{fmt(it.unit_price)}</td><td className="py-3 text-sm font-medium text-right">{fmt(it.amount)}</td></tr>))}
          </tbody>
        </table>

        <div className="flex justify-end mb-10">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{fmt(inv.subtotal)}</span></div>
            {inv.discount_amount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="text-red-600">-{fmt(inv.discount_amount)}</span></div>}
            {inv.tax_rate > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Tax ({inv.tax_rate}%)</span><span>{fmt(inv.tax_amount)}</span></div>}
            {inv.shipping > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Shipping</span><span>{fmt(inv.shipping)}</span></div>}
            <div className="flex justify-between text-base font-bold border-t-2 border-slate-300 pt-2"><span>Total</span><span>{fmt(inv.total)}</span></div>
            {totalPaid > 0 && <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>-{fmt(totalPaid)}</span></div>}
            {balance > 0 && totalPaid > 0 && <div className="flex justify-between text-sm font-bold text-amber-600"><span>Balance Due</span><span>{fmt(balance)}</span></div>}
          </div>
        </div>

        {(inv.notes || inv.terms) && <div className="border-t border-slate-200 pt-6 space-y-3">
          {inv.notes && <div><h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</h4><p className="text-sm text-slate-600">{inv.notes}</p></div>}
          {inv.terms && <div><h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Terms</h4><p className="text-sm text-slate-600">{inv.terms}</p></div>}
        </div>}

        {(inv.payments || []).length > 0 && (
          <div className="no-print border-t border-slate-200 pt-6 mt-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Payments</h4>
            <table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-500">Date</th><th className="text-left py-2 text-slate-500">Method</th><th className="text-left py-2 text-slate-500">Reference</th><th className="text-right py-2 text-slate-500">Amount</th></tr></thead>
              <tbody>{(inv.payments || []).map((p) => (<tr key={p.id} className="border-b border-slate-100"><td className="py-2">{p.payment_date}</td><td className="py-2">{p.method}</td><td className="py-2">{p.reference}</td><td className="py-2 text-right font-medium">{fmt(p.amount)}</td></tr>))}</tbody>
            </table>
          </div>
        )}

        <div className="no-print mt-6">
          {balance > 0 && !showPayment && <button onClick={() => setShowPayment(true)} className="btn-primary btn-sm">+ Record Payment</button>}
          {showPayment && (
            <div className="card p-4 mt-3">
              <h4 className="text-sm font-semibold mb-3">Record Payment</h4>
              <form onSubmit={recordPayment} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label text-xs">Amount *</label><input className="input text-sm" type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })} required /></div>
                  <div><label className="label text-xs">Method</label><select className="select text-sm" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}><option>Check</option><option>Cash</option><option>Credit Card</option><option>Bank Transfer</option><option>Zelle</option><option>Venmo</option></select></div>
                  <div><label className="label text-xs">Date</label><input className="input text-sm" type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-xs">Reference</label><input className="input text-sm" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
                  <div><label className="label text-xs">Notes</label><input className="input text-sm" value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowPayment(false)} className="btn-secondary btn-sm">Cancel</button><button type="submit" className="btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Record'}</button></div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
