'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Client { id: number; name: string; }
interface Product { id: number; name: string; unit_price: number; unit?: string; }
interface Bundle { id: number; name: string; price_per_linear_ft: number; glass_thickness?: string; category?: string; }

interface LineItem { product_id: number | null; bundle_id?: number | null; unit?: string; description: string; quantity: number; unit_price: number; amount: number; }

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [ncName, setNcName] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncPhone, setNcPhone] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  const [ncErr, setNcErr] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(8.25);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('Thank you for choosing Eagles Glass Inc!');
  const [terms, setTerms] = useState('Payment due within 30 days. 50% deposit required to begin work.');
  const [items, setItems] = useState<LineItem[]>([{ product_id: null, description: '', quantity: 1, unit_price: 0, amount: 0 }]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cRes, pRes, bRes] = await Promise.all([fetch('/api/clients'), fetch('/api/products'), fetch('/api/bundles')]);
        if (!cRes.ok || !pRes.ok) throw new Error('API error');
        const cData = await cRes.json(); const pData = await pRes.json(); const bData = bRes.ok ? await bRes.json() : [];
        if (cancelled) return;
        setClients(Array.isArray(cData) ? cData : []);
        setProducts(Array.isArray(pData) ? pData : []);
        setBundles(Array.isArray(bData) ? bData : []);
        const d = new Date(); d.setDate(d.getDate() + 30);
        setDueDate(d.toISOString().split('T')[0]);
      } catch (err) { console.error(err); if (!cancelled) setError('Failed to load data.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load(); return () => { cancelled = true; };
  }, []);

  const updateItem = (i: number, field: keyof LineItem, value: string | number | null) => {
    setItems((prev) => {
      const next = [...prev]; const item = { ...next[i] };
      if (field === 'quantity' || field === 'unit_price') item[field] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      else if (field === 'description') item.description = String(value);
      item.amount = Math.round(item.quantity * item.unit_price * 100) / 100;
      next[i] = item; return next;
    });
  };

  // Pick a catalog entry: a "system" (bundle, priced by the linear foot) or a
  // raw material/product. Fills the line's name + price so you quote from the
  // list; qty is then the measurement (linear feet for systems).
  const pickCatalog = (i: number, value: string) => {
    setItems((prev) => {
      const next = [...prev]; const item = { ...next[i] };
      if (!value) { item.product_id = null; item.bundle_id = null; item.unit = ''; }
      else if (value.startsWith('b:')) {
        const b = bundles.find((x) => x.id === parseInt(value.slice(2)));
        if (b) { item.bundle_id = b.id; item.product_id = null; item.description = b.name; item.unit_price = b.price_per_linear_ft; item.unit = 'linear ft'; }
      } else if (value.startsWith('p:')) {
        const p = products.find((x) => x.id === parseInt(value.slice(2)));
        if (p) { item.product_id = p.id; item.bundle_id = null; item.description = p.name; item.unit_price = p.unit_price; item.unit = p.unit || ''; }
      }
      item.amount = Math.round(item.quantity * item.unit_price * 100) / 100;
      next[i] = item; return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { product_id: null, bundle_id: null, unit: '', description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  const removeItem = (i: number) => { if (items.length <= 1) return; setItems((prev) => prev.filter((_, idx) => idx !== i)); };

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const discAmt = discountType === 'percent' ? subtotal * (discountValue / 100) : discountType === 'fixed' ? discountValue : 0;
  const after = subtotal - discAmt;
  const taxAmt = after * (taxRate / 100);
  const total = after + taxAmt + shipping;

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || items.some((it) => !it.description.trim())) return;
    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(clientId), issue_date: issueDate, due_date: dueDate,
          items: items.map((it) => ({ product_id: it.product_id, description: it.description, quantity: it.quantity, unit_price: it.unit_price })),
          tax_rate: taxRate, discount_type: discountType, discount_value: discountValue, shipping, notes, terms, type: 'invoice',
        }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed'); return; }
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } catch { alert('Error creating invoice.'); }
    finally { setSaving(false); }
  };

  const addClient = async () => {
    if (!ncName.trim()) return;
    setSavingClient(true); setNcErr('');
    try {
      const r = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: ncName.trim(), email: ncEmail.trim(), phone: ncPhone.trim() }) });
      if (!r.ok) throw new Error();
      const c = await r.json();
      setClients((list) => [...list, { id: c.id, name: c.name }]);
      setClientId(String(c.id));
      setShowNewClient(false);
      setNcName(''); setNcEmail(''); setNcPhone('');
    } catch { setNcErr('Could not add client.'); }
    finally { setSavingClient(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={() => window.location.reload()} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 no-print">
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Invoice Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="flex items-center justify-between"><label className="label">Client *</label><button type="button" onClick={() => setShowNewClient((v) => !v)} className="text-xs text-blue-600 hover:underline mb-1">{showNewClient ? 'Cancel' : '+ New client'}</button></div><select className="select" value={clientId} onChange={(e) => setClientId(e.target.value)} required><option value="">Select client...</option>{clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>{showNewClient ? (<div className="space-y-2 rounded-lg border border-slate-200 p-3 bg-slate-50 mt-2"><input className="input" placeholder="Client name *" value={ncName} onChange={(e) => setNcName(e.target.value)} /><div className="grid grid-cols-2 gap-2"><input className="input" placeholder="Email" value={ncEmail} onChange={(e) => setNcEmail(e.target.value)} /><input className="input" placeholder="Phone" value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} /></div><div className="flex items-center gap-2"><button type="button" onClick={addClient} disabled={savingClient || !ncName.trim()} className="btn-primary btn-sm">{savingClient ? 'Adding...' : 'Add & select'}</button>{ncErr && <span className="text-xs text-red-500">{ncErr}</span>}</div></div>) : null}</div>
                <div />
                <div><label className="label">Issue Date *</label><input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required /></div>
                <div><label className="label">Due Date *</label><input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></div>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Line Items</h2>
              <table className="w-full"><thead><tr className="border-b border-slate-200"><th className="text-left text-xs font-medium text-slate-500 pb-2 w-8">#</th><th className="text-left text-xs font-medium text-slate-500 pb-2 w-56">System / Item</th><th className="text-left text-xs font-medium text-slate-500 pb-2">Description</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-20">Qty</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-28">Price</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-28">Amount</th><th className="w-10" /></tr></thead>
                <tbody>{items.map((item, i) => (<tr key={i} className="border-b border-slate-100"><td className="py-2 text-sm text-slate-400">{i + 1}</td><td className="py-2 pr-2"><select className="select text-sm py-1.5" value={item.bundle_id ? `b:${item.bundle_id}` : item.product_id != null ? `p:${item.product_id}` : ''} onChange={(e) => pickCatalog(i, e.target.value)}><option value="">+ Add from catalog…</option>{bundles.length > 0 && (<optgroup label="Systems">{bundles.map((b) => (<option key={`b${b.id}`} value={`b:${b.id}`}>{b.name} — {fmt(b.price_per_linear_ft)}/ln ft</option>))}</optgroup>)}<optgroup label="Materials & Hardware">{products.map((p) => (<option key={`p${p.id}`} value={`p:${p.id}`}>{p.name} ({fmt(p.unit_price)}{p.unit ? `/${p.unit}` : ''})</option>))}</optgroup></select></td><td className="py-2 pr-2"><input className="input text-sm py-1.5" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required /></td><td className="py-2 pr-2"><input className="input text-sm py-1.5 text-right" type="number" step="0.01" min="0" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />{item.unit ? <div className="text-[10px] text-slate-400 text-right leading-tight mt-0.5">{item.unit}</div> : null}</td><td className="py-2 pr-2"><input className="input text-sm py-1.5 text-right" type="number" step="0.01" min="0" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} /></td><td className="py-2 text-right text-sm font-medium">{fmt(item.amount)}</td><td className="py-2 text-center">{items.length > 1 && (<button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>)}</td></tr>))}</tbody></table>
              <button type="button" onClick={addItem} className="btn-ghost btn-sm mt-3 text-navy-600">+ Add Line Item</button>
            </div>
            <div className="card p-5"><div className="grid grid-cols-2 gap-4"><div><label className="label">Notes</label><textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div><div><label className="label">Terms</label><textarea className="input" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></div></div></div>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                <div className="border-t border-slate-100 pt-2"><label className="label text-xs">Discount</label><div className="flex gap-2"><select className="select text-sm py-1.5 w-24" value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)}><option value="none">None</option><option value="percent">%</option><option value="fixed">$</option></select>{discountType !== 'none' && <input className="input text-sm py-1.5 flex-1" type="number" step="0.01" min="0" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} />}</div>{discountType !== 'none' && <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Discount</span><span className="text-red-500">-{fmt(discAmt)}</span></div>}</div>
                <div className="border-t border-slate-100 pt-2"><div className="flex items-center gap-2 mb-1"><label className="label text-xs mb-0">Tax Rate (%)</label><input className="input text-sm py-1 w-20" type="number" step="0.01" min="0" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} /></div><div className="flex justify-between text-sm"><span className="text-slate-400">Tax ({taxRate}%)</span><span>{fmt(taxAmt)}</span></div></div>
                <div className="border-t border-slate-100 pt-2"><div className="flex items-center gap-2"><label className="label text-xs mb-0">Shipping</label><input className="input text-sm py-1 w-24" type="number" step="0.01" min="0" value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} /></div></div>
                <div className="border-t-2 border-slate-200 pt-3 flex justify-between"><span className="text-lg font-bold text-slate-900">Total</span><span className="text-lg font-bold text-slate-900">{fmt(total)}</span></div>
              </div>
              <button type="submit" className="btn-primary w-full mt-5" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
