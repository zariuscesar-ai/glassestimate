'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Inv { id: number; invoice_number: string; client_name?: string; issue_date: string; due_date: string; total: number; status: string; }
interface Payment { amount: number; }

export default function InvoicesPage() {
  const sp = useSearchParams();
  const type = sp.get('type') || 'invoice';
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ type });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setError('Could not load invoices.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [type, statusFilter, search]);

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };
  const badge = (s: string) => {
    const m: Record<string, string> = { draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid', overdue: 'badge-overdue', viewed: 'badge-viewed', cancelled: 'badge-cancelled', accepted: 'badge-accepted', converted: 'badge-converted', expired: 'badge-expired' };
    return m[s] || 'badge-draft';
  };

  const title = type === 'estimate' ? 'Estimates' : 'Invoices';
  const newPath = type === 'estimate' ? '/estimates/new' : '/invoices/new';
  const detailPath = (id: number) => type === 'estimate' ? `/estimates/${id}` : `/invoices/${id}`;

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading {title.toLowerCase()}...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchInvoices} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <Link href="?type=invoice" className={`px-3 py-1.5 text-sm font-medium ${type === 'invoice' ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Invoices</Link>
            <Link href="?type=estimate" className={`px-3 py-1.5 text-sm font-medium ${type === 'estimate' ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Estimates</Link>
          </div>
        </div>
        <Link href={newPath} className="btn-primary">+ New {type === 'estimate' ? 'Estimate' : 'Invoice'}</Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select max-w-[160px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="sent">Sent</option><option value="viewed">Viewed</option>
          <option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
          {type === 'estimate' && (<><option value="accepted">Accepted</option><option value="converted">Converted</option><option value="expired">Expired</option></>)}
        </select>
      </div>

      {invoices.length === 0 ? (
        <div className="card text-center py-12"><p className="text-slate-500 mb-4">No {title.toLowerCase()} yet.</p><Link href={newPath} className="btn-primary btn-sm">Create your first {type === 'estimate' ? 'estimate' : 'invoice'}</Link></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="table-header">#</th><th className="table-header">Client</th><th className="table-header">Issue Date</th><th className="table-header">Due Date</th><th className="table-header text-right">Total</th><th className="table-header">Status</th><th className="table-header w-24">Actions</th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium text-navy-600"><Link href={detailPath(inv.id)}>{inv.invoice_number}</Link></td>
                  <td className="table-cell">{inv.client_name || '—'}</td>
                  <td className="table-cell text-slate-500">{inv.issue_date}</td>
                  <td className="table-cell text-slate-500">{inv.due_date}</td>
                  <td className="table-cell text-right font-medium">{fmt(inv.total)}</td>
                  <td className="table-cell"><span className={badge(inv.status)}>{inv.status}</span></td>
                  <td className="table-cell"><Link href={detailPath(inv.id)} className="btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
