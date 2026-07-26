'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Client { id: number; name: string; }
interface Product { id: number; name: string; unit_price: number; }
interface LineItem { product_id: number | null; description: string; quantity: number; unit_price: number; amount: number; }

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(8.25);
  const [discountType, setDiscountType] = useState<'none'|'percent'|'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ product_id: null, description: '', quantity: 1, unit_price: 0, amount: 0 }]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cR, pR, iR] = await Promise.all([
          fetch('/api/clients'), fetch('/api/products'), fetch(`/api/invoices/${params.id}`)
        ]);
        if (!cR.ok || !pR.ok || !iR.ok) throw new Error('Load failed');
        if (cancelled) return;
        setClients(Array.isArray(await cR.json()) ? await (await fetch('/api/clients')).json() : []);
        setProducts(Array.isArray(await pR.json()) ? await (await fetch('/api/products')).json() : []);
        const inv = await iR.json();
        setClientId(String(inv.client_id || ''));
        setIssueDate(inv.issue_date || '');
        setDueDate(inv.due_date || '');
        setTaxRate(inv.tax_rate ?? 8.25);
        setDiscountType(inv.discount_type || 'none');
        setDiscountValue(inv.discount_value ?? 0);
        setShipping(inv.shipping ?? 0);
        setNotes(inv.notes || '');
        setTerms(inv.terms || '');
        if (Array.isArray(inv.items) && inv.items.length > 0) {
          setItems(inv.items.map((it: { product_id?: number|null; description: string; quantity: number; unit_price: number }) => ({
            product_id: it.product_id ?? null,
            description: it.description || '',
            quantity: it.quantity || 1,
            unit_price: it.unit_price || 0,
            amount: (it.quantity || 0) * (it.unit_price || 0),
          })));
        }
      } catch (err) { console.error(err); if (!cancelled) setError('Failed to load invoice.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load(); return () => { cancelled = true; };
  }, [params.id]);

  // Re-fetch clients/products cleanly
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { if (Array.isArray(d)) setClients(d); }).catch(() => {});
    fetch('/api/products').then(r => r.json()).then(d => { if (Array.isArray(d)) setProducts(d); }).catch(() => {});
  }, []);

  const updateItem = (i: number, f: keyof LineItem, v: string|number|null) => {
    setItems(prev => {
      const n = [...prev]; const it = { ...n[i] };
      if (f === 'product_id' && typeof v === 'number') { it.product_id = v; const p = products.find(x => x.id === v); if (p) { it.description = p.name; it.unit_price = p.unit_price; } }
      else if (f === 'quantity' || f === 'unit_price') it[f] = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
      else if (f === 'description') it.description = String(v);
      it.amount = Math.round(it.quantity * it.unit_price * 100) / 100; n[i] = it; return n;
    });
  };
  const addItem = () => setItems(p => [...p, { product_id: null, description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  const removeItem = (i: number) => { if (items.length <= 1) return; setItems(p => p.filter((_, idx) => idx !== i)); };

  const sub = items.reduce((s, it) => s + it.amount, 0);
  const disc = discountType === 'percent' ? sub * (discountValue / 100) : discountType === 'fixed' ? discountValue : 0;
  const after = sub - disc; const tax = after * (taxRate / 100); const tot = after + tax + shipping;
  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!clientId || items.some(it => !it.description.trim())) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: parseInt(clientId), issue_date: issueDate, due_date: dueDate,
          items: items.map(it => ({ product_id: it.product_id, description: it.description, quantity: it.quantity, unit_price: it.unit_price })),
          tax_rate: taxRate, discount_type: discountType, discount_value: discountValue, shipping, notes, terms }),
      });
      if (!res.ok) { const er = await res.json(); alert(er.error || 'Update failed'); return; }
      router.push(`/invoices/${params.id}`);
    } catch { alert('Error updating invoice.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={() => router.back()} className="btn-primary">Go Back</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 no-print"><h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1><button onClick={() => router.back()} className="btn-secondary">Cancel</button></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5"><h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Client *</label><select className="select" value={clientId} onChange={e => setClientId(e.target.value)} required><option value="">Select...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div />
                <div><label className="label">Issue Date *</label><input className="input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required /></div>
                <div><label className="label">Due Date *</label><input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required /></div>
              </div>
            </div>
            <div className="card p-5"><h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Line Items</h2>
              <table className="w-full"><thead><tr className="border-b border-slate-200"><th className="text-left text-xs font-medium text-slate-500 pb-2 w-8">#</th><th className="text-left text-xs font-medium text-slate-500 pb-2">Product</th><th className="text-left text-xs font-medium text-slate-500 pb-2">Description</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-20">Qty</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-28">Price</th><th className="text-right text-xs font-medium text-slate-500 pb-2 w-28">Amount</th><th className="w-10" /></tr></thead>
                <tbody>{items.map((item, i) => (<tr key={i} className="border-b border-slate-100"><td className="py-2 text-sm text-slate-400">{i+1}</td><td className="py-2 pr-2"><select className="select text-sm py-1.5" value={item.product_id ?? ''} onChange={e => { const v = e.target.value ? parseInt(e.target.value) : null; updateItem(i, 'product_id', v); }}><option value="">—</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({fmt(p.unit_price)})</option>)}</select></td><td className="py-2 pr-2"><input className="input text-sm py-1.5" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required /></td><td className="py-2 pr-2"><input className="input text-sm py-1.5 text-right" type="number" step="0.01" min="0" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td><td className="py-2 pr-2"><input className="input text-sm py-1.5 text-right" type="number" step="0.01" min="0" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} /></td><td className="py-2 text-right text-sm font-medium">{fmt(item.amount)}</td><td className="py-2 text-center">{items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>}</td></tr>))}</tbody></table>
              <button type="button" onClick={addItem} className="btn-ghost btn-sm mt-3 text-navy-600">+ Add Line Item</button>
            </div>
            <div className="card p-5"><div className="grid grid-cols-2 gap-4"><div><label className="label">Notes</label><textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div><div><label className="label">Terms</label><textarea className="input" rows={3} value={terms} onChange={e => setTerms(e.target.value)} /></div></div></div>
          </div>
          <div className="space-y-4">
            <div className="card p-5"><h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(sub)}</span></div>
                <div className="border-t border-slate-100 pt-2"><label className="label text-xs">Discount</label><div className="flex gap-2"><select className="select text-sm py-1.5 w-24" value={discountType} onChange={e => setDiscountType(e.target.value as never)}><option value="none">None</option><option value="percent">%</option><option value="fixed">$</option></select>{discountType !== 'none' && <input className="input text-sm py-1.5 flex-1" type="number" step="0.01" min="0" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value)||0)} />}</div>{discountType !== 'none' && <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Discount</span><span className="text-red-500">-{fmt(disc)}</span></div>}</div>
                <div className="border-t border-slate-100 pt-2"><div className="flex items-center gap-2 mb-1"><label className="label text-xs mb-0">Tax Rate (%)</label><input className="input text-sm py-1 w-20" type="number" step="0.01" min="0" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value)||0)} /></div><div className="flex justify-between text-sm"><span className="text-slate-400">Tax</span><span>{fmt(tax)}</span></div></div>
                <div className="border-t border-slate-100 pt-2"><div className="flex items-center gap-2"><label className="label text-xs mb-0">Shipping</label><input className="input text-sm py-1 w-24" type="number" step="0.01" min="0" value={shipping} onChange={e => setShipping(parseFloat(e.target.value)||0)} /></div></div>
                <div className="border-t-2 border-slate-200 pt-3 flex justify-between"><span className="text-lg font-bold text-slate-900">Total</span><span className="text-lg font-bold text-slate-900">{fmt(tot)}</span></div>
              </div>
              <button type="submit" className="btn-primary w-full mt-5" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
