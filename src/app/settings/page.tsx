'use client'; import { useEffect, useState } from 'react';
export default function SettingsPage() {
  const [s, setS] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fetchS = async () => { setLoading(true); setError(''); try { const r = await fetch('/api/companies'); if(!r.ok) throw new Error(''); setS((await r.json())[0] || {}); } catch { setError('Could not load settings.'); } finally { setLoading(false); } };
  useEffect(() => { fetchS(); }, []);
  const save = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setMsg(''); try { await fetch('/api/companies', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, id: 1 }) }); setMsg('Saved.'); } catch { setMsg('Failed.'); } finally { setSaving(false); } };
  const ch = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));
  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchS} className="btn-primary">Retry</button></div>;
  const fields = [
    { k: 'name', l: 'Company Name' },
    { k: 'address', l: 'Address' },
    { k: 'phone', l: 'Phone' },
    { k: 'email', l: 'Email' },
    { k: 'website', l: 'Website' },
    { k: 'tax_id', l: 'Tax ID / EIN' },
    { k: 'invoice_prefix', l: 'Invoice Prefix' },
    { k: 'default_tax_rate', l: 'Default Tax Rate (%)' },
    { k: 'default_due_days', l: 'Default Due Days' },
    { k: 'default_notes', l: 'Default Notes' },
    { k: 'default_terms', l: 'Default Terms' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <form onSubmit={save}>
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Company Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ k, l }) => (
              <div key={k} className={l === 'Address' || k === 'default_notes' || k === 'default_terms' ? 'md:col-span-2' : ''}>
                <label className="label">{l}</label>
                {['address', 'default_notes', 'default_terms'].includes(k) ? (
                  <textarea className="input" rows={2} value={s[k] || ''} onChange={(e) => ch(k, e.target.value)} />
                ) : (
                  <input className="input" value={s[k] || ''} onChange={(e) => ch(k, e.target.value)} type={k.includes('rate') || k.includes('due') ? 'number' : 'text'} />
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
