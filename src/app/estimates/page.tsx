'use client'; import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Inv { id: number; invoice_number: string; client_name?: string; issue_date: string; total: number; status: string; }

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/invoices?type=estimate');
      if (!res.ok) throw new Error('');
      setEstimates(Array.isArray(await res.json()) ? await (await fetch('/api/invoices?type=estimate')).json() : []);
    } catch { setError('Could not load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n||0); } catch { return '$0.00'; } };
  const badge = (s: string) => { const m: Record<string,string> = { draft:'badge-draft', sent:'badge-sent', accepted:'badge-accepted', converted:'badge-converted', expired:'badge-expired' }; return m[s]||'badge-draft'; };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading estimates...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetch} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Estimates</h1>
        <div className="flex gap-2">
          <Link href="/visual-estimator" className="btn-secondary btn-sm">🎨 Visual Estimator</Link>
          <Link href="/estimates/new" className="btn-primary">+ New Estimate</Link>
        </div>
      </div>
      {estimates.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-4">No estimates yet.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/visual-estimator" className="btn-primary btn-sm">Create with Visual Estimator</Link>
            <Link href="/estimates/new" className="btn-secondary btn-sm">Create manually</Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full"><thead><tr><th className="table-header">Estimate #</th><th className="table-header">Client</th><th className="table-header">Date</th><th className="table-header text-right">Total</th><th className="table-header">Status</th><th className="table-header w-24">View</th></tr></thead>
            <tbody>{estimates.map(e => (
              <tr key={e.id} className="hover:bg-slate-50"><td className="table-cell font-medium text-navy-600"><Link href={`/invoices/${e.id}`}>{e.invoice_number}</Link></td><td className="table-cell">{e.client_name||'—'}</td><td className="table-cell text-slate-500">{e.issue_date}</td><td className="table-cell text-right font-medium">{fmt(e.total)}</td><td className="table-cell"><span className={badge(e.status)}>{e.status}</span></td><td className="table-cell"><Link href={`/invoices/${e.id}`} className="btn-ghost btn-sm">View</Link></td></tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
