'use client';

import { useEffect, useState } from 'react';

interface Product { id: number; name: string; description: string; unit_price: number; cost_price: number; unit: string; category: string; sku: string; is_active: boolean; }
const CATS = ['Tempered Glass', 'Laminated Glass', 'Insulated Glass', 'Mirror', 'Hardware', 'Framing', 'Installation Labor', 'Removal/Disposal'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', unit_price: 0, cost_price: 0, unit: 'each', category: '', sku: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (search) params.set('search', search);
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setError('Could not load products.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [filterCategory, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', unit_price: 0, cost_price: 0, unit: 'each', category: '', sku: '', is_active: true }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, description: p.description || '', unit_price: p.unit_price, cost_price: p.cost_price, unit: p.unit, category: p.category || '', sku: p.sku || '', is_active: p.is_active }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Save failed'); return; }
      await fetchProducts(); setShowForm(false);
    } catch { alert('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await fetch(`/api/products/${id}`, { method: 'DELETE' }); await fetchProducts(); }
    catch { alert('Delete failed.'); }
  };

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  if (loading) return <div className="flex justify-center py-20"><p className="text-slate-400 text-lg">Loading products...</p></div>;
  if (error) return <div className="flex flex-col items-center py-20"><p className="text-red-500 text-lg mb-4">{error}</p><button onClick={fetchProducts} className="btn-primary">Retry</button></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Products &amp; Services</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Product</button>
      </div>
      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select max-w-[200px]" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {products.length === 0 ? (
        <div className="card text-center py-12"><p className="text-slate-500 mb-4">No products yet.</p><button onClick={openCreate} className="btn-primary btn-sm">Add your first product</button></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="table-header">Name</th><th className="table-header">SKU</th><th className="table-header">Category</th><th className="table-header">Unit</th><th className="table-header text-right">Price</th><th className="table-header w-24">Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="table-cell"><div className="font-medium text-slate-900">{p.name}</div>{p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}</td>
                  <td className="table-cell text-xs text-slate-400 font-mono">{p.sku || '—'}</td>
                  <td className="table-cell"><span className="badge bg-navy-50 text-navy-700">{p.category || 'Uncategorized'}</span></td>
                  <td className="table-cell text-slate-500">{p.unit}</td>
                  <td className="table-cell text-right font-medium">{fmt(p.unit_price)}</td>
                  <td className="table-cell"><div className="flex gap-2"><button onClick={() => openEdit(p)} className="btn-ghost btn-sm">Edit</button><button onClick={() => handleDelete(p.id)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">Del</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Price *</label><input className="input" type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} required /></div>
                <div><label className="label">Cost Price</label><input className="input" type="number" step="0.01" min="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Unit</label><select className="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="each">each</option><option value="sq ft">sq ft</option><option value="hour">hour</option><option value="linear ft">linear ft</option><option value="job">job</option></select></div>
                <div><label className="label">Category</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Uncategorized</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" /><span className="text-sm text-slate-700">Active</span></label>
              <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
