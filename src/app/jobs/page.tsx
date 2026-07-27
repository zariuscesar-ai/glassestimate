'use client'; import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Job { id: number; name: string; client_name?: string; status: string; priority: string; start_date: string; assigned_crew: string; total_linear_ft: number; }

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'badge bg-blue-100 text-blue-700', in_progress: 'badge bg-amber-100 text-amber-700',
  pending_materials: 'badge bg-purple-100 text-purple-700', ready_for_install: 'badge bg-emerald-100 text-emerald-700',
  completed: 'badge bg-green-100 text-green-700', on_hold: 'badge bg-red-100 text-red-700',
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600 font-bold', high: 'text-amber-600 font-semibold', normal: 'text-slate-500', low: 'text-slate-400',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true); setError('');
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/jobs${params}`);
      if (!res.ok) throw new Error('');
      setJobs(Array.isArray(await res.json()) ? await (await fetch(`/api/jobs${params}`)).json() : []);
    } catch { setError('Could not load jobs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter]);

  const counts = { total: jobs.length, scheduled: jobs.filter(j => j.status === 'scheduled').length, in_progress: jobs.filter(j => j.status === 'in_progress').length, completed: jobs.filter(j => j.status === 'completed').length };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading jobs...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchJobs} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Job Management</h1>
        <Link href="/jobs/new" className="btn-primary">+ New Job</Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><p className="stat-label">Total Jobs</p><p className="stat-value">{counts.total}</p></div>
        <div className="stat-card"><p className="stat-label">Scheduled</p><p className="stat-value text-blue-600">{counts.scheduled}</p></div>
        <div className="stat-card"><p className="stat-label">In Progress</p><p className="stat-value text-amber-600">{counts.in_progress}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value text-green-600">{counts.completed}</p></div>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="select max-w-[200px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option>
          <option value="pending_materials">Pending Materials</option><option value="ready_for_install">Ready for Install</option>
          <option value="completed">Completed</option><option value="on_hold">On Hold</option>
        </select>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12"><p className="text-slate-500 mb-4">No jobs yet.</p><Link href="/jobs/new" className="btn-primary btn-sm">Create first job</Link></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full"><thead><tr><th className="table-header">Job</th><th className="table-header">Client</th><th className="table-header">Status</th><th className="table-header">Priority</th><th className="table-header">Start Date</th><th className="table-header">Crew</th><th className="table-header text-right">Glass (ft)</th><th className="table-header w-20">View</th></tr></thead>
            <tbody>{jobs.map(j => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium text-navy-600"><Link href={`/jobs/${j.id}`}>{j.name}</Link></td>
                <td className="table-cell">{j.client_name || '—'}</td>
                <td className="table-cell"><span className={STATUS_COLORS[j.status] || 'badge'}>{j.status.replace(/_/g, ' ')}</span></td>
                <td className={`table-cell text-xs ${PRIORITY_COLORS[j.priority] || ''}`}>{j.priority}</td>
                <td className="table-cell text-slate-500">{j.start_date || '—'}</td>
                <td className="table-cell text-slate-500">{j.assigned_crew || '—'}</td>
                <td className="table-cell text-right font-medium">{j.total_linear_ft > 0 ? `${j.total_linear_ft} ft` : '—'}</td>
                <td className="table-cell"><Link href={`/jobs/${j.id}`} className="btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
