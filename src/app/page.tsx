'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardStats } from '@/lib/schema';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('API error');
      setStats(await res.json());
    } catch (err) { console.error(err); setError('Could not load dashboard.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };
  const badge = (s: string) => {
    const m: Record<string, string> = { draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid', overdue: 'badge-overdue', viewed: 'badge-viewed', cancelled: 'badge-cancelled' };
    return m[s] || 'badge-draft';
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading dashboard...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchStats} className="btn-primary">Retry</button></div>;
  if (!stats) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/estimates/new" className="btn-secondary btn-sm">New Estimate</Link>
          <Link href="/invoices/new" className="btn-primary">+ New Invoice</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><p className="stat-label">Revenue This Month</p><p className="stat-value text-green-600">{fmt(stats.revenueThisMonth)}</p></div>
        <div className="stat-card"><p className="stat-label">Outstanding</p><p className="stat-value text-amber-600">{fmt(stats.outstandingTotal)}</p></div>
        <div className="stat-card"><p className="stat-label">Overdue Invoices</p><p className="stat-value text-red-600">{stats.overdueCount}</p></div>
        <div className="stat-card"><p className="stat-label">Pending Estimates</p><p className="stat-value text-blue-600">{stats.estimatesPending}</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><p className="stat-label">Total Clients</p><p className="stat-value">{stats.totalClients}</p></div>
        <div className="stat-card"><p className="stat-label">Total Products</p><p className="stat-value">{stats.totalProducts}</p></div>
        <div className="stat-card"><p className="stat-label">Total Invoices</p><p className="stat-value">{stats.totalInvoices}</p></div>
        <div className="stat-card"><p className="stat-label">YTD Revenue</p><p className="stat-value">{fmt(stats.revenueYTD)}</p></div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
          <Link href="/invoices" className="text-sm text-navy-600 hover:text-navy-800">View All →</Link>
        </div>
        {stats.recentInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center"><p className="text-slate-500 mb-3">No invoices yet.</p><Link href="/invoices/new" className="btn-primary btn-sm">Create your first invoice</Link></div>
        ) : (
          <table className="w-full">
            <thead><tr><th className="table-header">Invoice #</th><th className="table-header">Client</th><th className="table-header">Date</th><th className="table-header text-right">Total</th><th className="table-header">Status</th></tr></thead>
            <tbody>
              {stats.recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium text-navy-600"><Link href={`/invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                  <td className="table-cell">{inv.client_name || '—'}</td>
                  <td className="table-cell">{inv.issue_date}</td>
                  <td className="table-cell text-right font-medium">{fmt(inv.total)}</td>
                  <td className="table-cell"><span className={badge(inv.status)}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
