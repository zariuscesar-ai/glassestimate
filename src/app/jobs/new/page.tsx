'use client'; import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Client { id: number; name: string; }
interface Inv { id: number; invoice_number: string; type: string; }

export default function NewJobPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [estimates, setEstimates] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [assignedCrew, setAssignedCrew] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [estimateId, setEstimateId] = useState('');
  const [totalLFt, setTotalLFt] = useState(0);
  const [totalSqFt, setTotalSqFt] = useState(0);
  const [doorCount, setDoorCount] = useState(0);
  const [glassTypes, setGlassTypes] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/clients'), fetch('/api/invoices?type=estimate')]).then(async ([cR, eR]) => {
      if (cR.ok) setClients(Array.isArray(await cR.json()) ? await (await fetch('/api/clients')).json() : []);
      if (eR.ok) setEstimates(Array.isArray(await eR.json()) ? await (await fetch('/api/invoices?type=estimate')).json() : []);
    }).finally(() => setLoading(false));
  }, []);

  // Load correctly
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { if (Array.isArray(d)) setClients(d); }).catch(() => {});
    fetch('/api/invoices?type=estimate').then(r => r.json()).then(d => { if (Array.isArray(d)) setEstimates(d); }).catch(() => {});
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!clientId || !name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: parseInt(clientId), name, description, start_date: startDate, end_date: endDate, priority, assigned_crew: assignedCrew, job_site_address: jobAddress, notes, estimate_id: estimateId ? parseInt(estimateId) : null, total_linear_ft: totalLFt, total_sq_ft: totalSqFt, door_count: doorCount, glass_types: glassTypes }),
      });
      if (!res.ok) { alert('Failed'); return; }
      const job = await res.json();
      router.push(`/jobs/${job.id}`);
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8"><h1 className="text-2xl font-bold text-slate-900">New Job</h1><button onClick={() => router.back()} className="btn-secondary">Cancel</button></div>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Client *</label><select className="select" value={clientId} onChange={e => setClientId(e.target.value)} required><option value="">Select...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Job Name *</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Office Renovation - Suite 300" required /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Scope of work..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className="label">Target End Date</label><input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Priority</label><select className="select" value={priority} onChange={e => setPriority(e.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
            <div><label className="label">Assigned Crew</label><input className="input" value={assignedCrew} onChange={e => setAssignedCrew(e.target.value)} placeholder="e.g. Team A / John + Mike" /></div>
          </div>
          <div><label className="label">Job Site Address</label><input className="input" value={jobAddress} onChange={e => setJobAddress(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Glass Types</label><input className="input" value={glassTypes} onChange={e => setGlassTypes(e.target.value)} placeholder="1/2\" Tempered, etc." /></div>
            <div><label className="label">Total Linear Ft</label><input className="input" type="number" step="0.1" value={totalLFt} onChange={e => setTotalLFt(parseFloat(e.target.value)||0)} /></div>
            <div><label className="label">Total Sq Ft</label><input className="input" type="number" step="0.1" value={totalSqFt} onChange={e => setTotalSqFt(parseFloat(e.target.value)||0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Door Count</label><input className="input" type="number" value={doorCount} onChange={e => setDoorCount(parseInt(e.target.value)||0)} /></div>
            <div><label className="label">Link Estimate (optional)</label><select className="select" value={estimateId} onChange={e => setEstimateId(e.target.value)}><option value="">None</option>{estimates.map(e => <option key={e.id} value={e.id}>{e.invoice_number} - {e.total}</option>)}</select></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Job'}</button></div>
        </div>
      </form>
    </div>
  );
}
