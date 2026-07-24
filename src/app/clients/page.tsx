'use client';

import { useEffect, useState } from 'react';

interface Client { id: number; name: string; contact_person: string; email: string; phone: string; billing_address: string; shipping_address: string; notes: string; }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', billing_address: '', shipping_address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setError('Could not load clients.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', contact_person: '', email: '', phone: '', billing_address: '', shipping_address: '', notes: '' }); setShowForm(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ name: c.name, contact_person: c.contact_person || '', email: c.email || '', phone: c.phone || '', billing_address: c.billing_address || '', shipping_address: c.shipping_address || '', notes: c.notes || '' }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/clients/${editing.id}` : '/api/clients';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Save failed'); return; }
      await fetchClients(); setShowForm(false);
    } catch { alert('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client?')) return;
    try { await fetch(`/api/clients/${id}`, { method: 'DELETE' }); await fetchClients(); }
    catch { alert('Delete failed.'); }
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading clients...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchClients} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Client</button>
      </div>
      {clients.length === 0 ? (
        <div className="card text-center py-12"><p className="text-slate-500 mb-4">No clients yet.</p><button onClick={openCreate} className="btn-primary btn-sm">Add your first client</button></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="table-header">Name</th><th className="table-header">Contact</th><th className="table-header">Email</th><th className="table-header">Phone</th><th className="table-header w-24">Actions</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium text-slate-900">{c.name}</td>
                  <td className="table-cell text-slate-500">{c.contact_person || '—'}</td>
                  <td className="table-cell text-slate-500">{c.email || '—'}</td>
                  <td className="table-cell text-slate-500">{c.phone || '—'}</td>
                  <td className="table-cell"><div className="flex gap-2"><button onClick={() => openEdit(c)} className="btn-ghost btn-sm">Edit</button><button onClick={() => handleDelete(c.id)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">Del</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Client' : 'New Client'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Contact Person</label><input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><label className="label">Billing Address</label><textarea className="input" rows={2} value={form.billing_address} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} /></div>
              <div><label className="label">Shipping Address</label><textarea className="input" rows={2} value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} /></div>
              <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
