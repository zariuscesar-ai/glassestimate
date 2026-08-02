'use client'; import { useEffect, useState, useRef } from 'react';

export default function SettingsPage() {
  const [s, setS] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchS = async () => { setLoading(true); setError(''); try { const r = await fetch('/api/companies'); if(!r.ok) throw new Error(''); setS((await r.json())[0] || {}); } catch { setError('Could not load settings.'); } finally { setLoading(false); } };
  useEffect(() => { fetchS(); }, []);

  const save = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setMsg(''); try { const r = await fetch('/api/companies/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }); if (!r.ok) throw new Error(''); setMsg('Saved.'); } catch { setMsg('Failed.'); } finally { setSaving(false); } };
  const ch = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert('Logo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => ch('logo', reader.result as string);
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchS} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg.includes('Fail') ? 'text-red-500' : 'text-green-600'}`}>{msg}</span>}
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-8 max-w-2xl">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Company Branding</h2>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              {s.logo ? (
                <img src={s.logo} alt="Logo" className="w-24 h-24 object-contain border rounded-lg" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-3xl text-slate-300">🏢</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm">📷 Upload Logo</button>
              <p className="text-xs text-slate-400">PNG or JPG, under 500KB. Transparent background recommended.</p>
              <div className="pt-1">
                <label className="label text-xs">Or paste logo URL</label>
                <input className="input text-sm" value={s.logo || ''} onChange={e => ch('logo', e.target.value)} placeholder="https://example.com/logo.png" />
              </div>
              {s.logo && <button type="button" onClick={() => ch('logo', '')} className="text-xs text-red-500 hover:text-red-700">Remove logo</button>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { k: 'name', l: 'Company Name' },
              { k: 'address', l: 'Address' },
              { k: 'phone', l: 'Phone' },
              { k: 'email', l: 'Email' },
              { k: 'website', l: 'Website' },
              { k: 'tax_id', l: 'Tax ID / EIN' },
            ].map(({ k, l }) => (
              <div key={k} className={l === 'Address' ? 'md:col-span-2' : ''}>
                <label className="label">{l}</label>
                {l === 'Address' ? <textarea className="input" rows={2} value={s[k] || ''} onChange={e => ch(k, e.target.value)} /> : <input className="input" value={s[k] || ''} onChange={e => ch(k, e.target.value)} />}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { k: 'invoice_prefix', l: 'Invoice Prefix' },
              { k: 'default_tax_rate', l: 'Default Tax Rate (%)', type: 'number' },
              { k: 'default_due_days', l: 'Default Due Days', type: 'number' },
              { k: 'default_notes', l: 'Default Notes', area: true },
              { k: 'default_terms', l: 'Default Terms', area: true },
            ].map(({ k, l, type, area }) => (
              <div key={k} className={area ? 'md:col-span-2' : ''}>
                <label className="label">{l}</label>
                {area ? <textarea className="input" rows={2} value={s[k] || ''} onChange={e => ch(k, e.target.value)} /> : <input className="input" type={type || 'text'} value={s[k] || ''} onChange={e => ch(k, e.target.value)} />}
              </div>
            ))}
          </div>
        </div>
      </form>

      <div className="max-w-2xl mt-8">
        <ChangePasswordCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setOk(false);
    if (next.length < 8) { setMsg('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setMsg('New password and confirmation do not match.'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(data.error || 'Could not change password.'); return; }
      setOk(true); setMsg('Password updated.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch {
      setMsg('Could not change password.');
    } finally { setSaving(false); }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-1">Account Security</h2>
      <p className="text-xs text-slate-400 mb-4">Change your login password. You&apos;ll stay signed in on this device.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input className="input" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-400">At least 8 characters.</p>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving || !current || !next || !confirm}>{saving ? 'Updating...' : 'Update Password'}</button>
          {msg && <span className={`text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>{msg}</span>}
        </div>
      </form>
    </div>
  );
}
