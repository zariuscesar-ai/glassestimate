'use client'; import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job { id: number; company_id: number; client_id: number; estimate_id: number | null; invoice_id: number | null; name: string; description: string; status: string; priority: string; start_date: string; end_date: string; assigned_crew: string; job_site_address: string; glass_types: string; total_sq_ft: number; total_linear_ft: number; door_count: number; notes: string; created_at: string; updated_at: string; client_name?: string; }

const STATUS_FLOW: Record<string, string[]> = {
  scheduled: ['in_progress', 'on_hold'],
  in_progress: ['pending_materials', 'ready_for_install', 'on_hold'],
  pending_materials: ['ready_for_install', 'in_progress', 'on_hold'],
  ready_for_install: ['completed', 'in_progress', 'on_hold'],
  completed: [],
  on_hold: ['scheduled', 'in_progress'],
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', in_progress: 'In Progress', pending_materials: 'Pending Materials',
  ready_for_install: 'Ready for Install', completed: 'Completed', on_hold: 'On Hold',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700',
  pending_materials: 'bg-purple-100 text-purple-700', ready_for_install: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700', on_hold: 'bg-red-100 text-red-700',
};

export default function JobDetailPage() {
  const params = useParams(); const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchJob = async () => {
    setLoading(true); setError('');
    try { const r = await fetch(`/api/jobs/${params.id}`); if (!r.ok) { setError('Not found'); return; } setJob(await r.json()); }
    catch { setError('Could not load job.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchJob(); }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    if (!job) return; setUpdating(true);
    try { const r = await fetch(`/api/jobs/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); if (r.ok) setJob(await r.json()); }
    catch { alert('Failed'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => { if (!confirm('Delete this job?')) return; await fetch(`/api/jobs/${params.id}`, { method: 'DELETE' }); router.push('/jobs'); };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading job...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><Link href="/jobs" className="btn-primary">Back to Jobs</Link></div>;
  if (!job) return null;

  const nextStatuses = STATUS_FLOW[job.status] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><Link href="/jobs" className="btn-ghost btn-sm">&larr; Jobs</Link><span className={`badge text-sm ${STATUS_COLORS[job.status]}`}>{STATUS_LABELS[job.status]}</span><span className="text-xs text-slate-400 uppercase">{job.priority} priority</span></div>
        <div className="flex gap-2">
          {nextStatuses.map(s => <button key={s} onClick={() => updateStatus(s)} disabled={updating} className={`btn-sm ${s === 'completed' ? 'btn-primary' : 'btn-secondary'}`}>{STATUS_LABELS[s]}</button>)}
          <Link href={`/jobs/${job.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <button onClick={handleDelete} className="btn-ghost btn-sm text-red-600">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5"><h2 className="text-lg font-semibold text-slate-900 mb-1">{job.name}</h2><p className="text-sm text-slate-600">{job.description || 'No description'}</p></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase mb-1">Client</p><p className="font-medium">{job.client_name || '—'}</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase mb-1">Assigned Crew</p><p className="font-medium">{job.assigned_crew || 'Unassigned'}</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase mb-1">Job Site</p><p className="text-sm">{job.job_site_address || '—'}</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase mb-1">Dates</p><p className="text-sm">{job.start_date || 'TBD'} → {job.end_date || 'TBD'}</p></div>
          </div>

          <div className="card p-5"><h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Glass & Measurements</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-2xl font-bold text-navy-700">{job.total_linear_ft || 0}</p><p className="text-xs text-slate-500">Linear Feet</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-2xl font-bold text-navy-700">{job.total_sq_ft || 0}</p><p className="text-xs text-slate-500">Square Feet</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-2xl font-bold text-navy-700">{job.door_count || 0}</p><p className="text-xs text-slate-500">Doors</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-sm font-medium text-navy-700">{job.glass_types || 'N/A'}</p><p className="text-xs text-slate-500">Glass Type</p></div>
            </div>
          </div>

          {job.notes && <div className="card p-5"><h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Notes</h3><p className="text-sm text-slate-600 whitespace-pre-wrap">{job.notes}</p></div>}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Status Timeline</h3>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => {
                const isActive = job.status === key;
                const isPast = Object.keys(STATUS_LABELS).indexOf(key) < Object.keys(STATUS_LABELS).indexOf(job.status);
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-navy-600 ring-2 ring-navy-300' : isPast ? 'bg-green-400' : 'bg-slate-300'}`} />
                    <span className={isActive ? 'font-semibold text-navy-900' : isPast ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
                    {isActive && <span className="text-xs text-navy-500 ml-auto">← current</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {job.estimate_id && <div className="card p-4"><h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Linked Estimate</h3><Link href={`/invoices/${job.estimate_id}`} className="btn-secondary btn-sm w-full">View Estimate</Link></div>}
          {job.invoice_id && <div className="card p-4"><h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Linked Invoice</h3><Link href={`/invoices/${job.invoice_id}`} className="btn-secondary btn-sm w-full">View Invoice</Link></div>}

          <div className="card p-4"><p className="text-xs text-slate-400">Created: {job.created_at}</p><p className="text-xs text-slate-400">Updated: {job.updated_at}</p></div>
        </div>
      </div>
    </div>
  );
}
