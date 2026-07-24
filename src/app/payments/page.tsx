'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Inv { id: number; invoice_number: string; client_name?: string; issue_date: string; due_date: string; total: number; status: string; payments?: { id: number; amount: number; method: string; reference: string; payment_date: string; notes: string; }[]; }

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ type: 'invoice' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error('API error');
      setInvoices(Array.isArray(await res.json()) ? await (await fetch(`/api/invoices?${params}`)).json() : []);
    } catch { setError('Could not load.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [search]);

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  // Re-fetch with proper pattern
  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ type: 'invoice' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setError('Could not load invoices.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const getBalance = (inv: Inv) => {
    const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
    return inv.total - paid;
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={load} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
      </div>
      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search invoice or client..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {invoices.length === 0 ? (
        <div className="card text-center py-12"><p className="text-slate-500">No invoices with payments yet.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="table-header">Invoice #</th><th className="table-header">Client</th><th className="table-header">Total</th><th className="table-header text-right">Paid</th><th className="table-header text-right">Balance</th><th className="table-header">Status</th><th className="table-header">Last Payment</th></tr></thead>
            <tbody>
              {invoices.map((inv) => {
                const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
                const balance = inv.total - paid;
                const lastPay = (inv.payments || []).slice(-1)[0];
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="table-cell font-medium text-navy-600"><Link href={`/invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                    <td className="table-cell">{inv.client_name || '—'}</td>
                    <td className="table-cell font-medium">{fmt(inv.total)}</td>
                    <td className="table-cell text-right text-green-600 font-medium">{fmt(paid)}</td>
                    <td className="table-cell text-right font-medium">{balance <= 0 ? <span className="text-green-600">Paid</span> : <span className="text-red-600">{fmt(balance)}</span>}</td>
                    <td className="table-cell">{inv.status}</td>
                    <td className="table-cell text-slate-500 text-xs">{lastPay ? `${lastPay.payment_date} — ${lastPay.method} ${fmt(lastPay.amount)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
