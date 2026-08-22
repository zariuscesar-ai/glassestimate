'use client';

// Glass Replacement estimator — the daily driver for small shops and solo
// contractors. Price window/IGU glass, single-pane cut glass, mirrors, and
// storefront/replacement glass by united inch, in the shop's own rates.

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_GLASS_TYPES, DEFAULT_GRID_PRICING, SIXTEENTHS,
  fromInches, toInches, unitedInches, priceLine, quoteTotals, money, newLine,
  type GlassType, type LineItem, type Shape, type GridSize,
} from '@/lib/glass/replacement';

const SHAPES: { id: Shape; label: string }[] = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
];
const GRIDS: { id: GridSize; label: string }[] = [
  { id: 'none', label: 'No grid' },
  { id: '5/8', label: 'Grid 5/8"' },
  { id: '3/4', label: 'Grid 3/4"' },
  { id: '1', label: 'Grid 1"' },
];

export default function GlassReplacementPage() {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [types, setTypes] = useState<GlassType[]>(DEFAULT_GLASS_TYPES);
  const [gridRate, setGridRate] = useState<number>(DEFAULT_GRID_PRICING.ratePerUI);
  const [lines, setLines] = useState<LineItem[]>([newLine(DEFAULT_GLASS_TYPES[0].id)]);
  const [customer, setCustomer] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [showRates, setShowRates] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Identify the shop, then load its saved rates (per-browser for now).
  useEffect(() => {
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const id = d?.company?.id ?? null;
      setCompanyId(id);
      setCompanyName(d?.company?.name || '');
      try {
        const raw = id != null ? localStorage.getItem(`glassrep:rates:${id}`) : null;
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved?.types) && saved.types.length) setTypes(saved.types);
          if (typeof saved?.gridRate === 'number') setGridRate(saved.gridRate);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Persist rates whenever they change (after the initial load).
  useEffect(() => {
    if (!loaded || companyId == null) return;
    try { localStorage.setItem(`glassrep:rates:${companyId}`, JSON.stringify({ types, gridRate })); } catch { /* ignore */ }
  }, [types, gridRate, companyId, loaded]);

  const lineTotals = useMemo(
    () => lines.map((l) => priceLine(l, types, { ratePerUI: gridRate })),
    [lines, types, gridRate],
  );
  const totals = useMemo(() => quoteTotals(lineTotals, taxRate), [lineTotals, taxRate]);

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));
  const addLine = () => setLines((ls) => [...ls, newLine(types[0]?.id || '')]);

  const updateType = (id: string, patch: Partial<GlassType>) =>
    setTypes((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const addType = () =>
    setTypes((ts) => [...ts, { id: 'c' + Math.random().toString(36).slice(2, 8), name: 'New glass type', ratePerUI: 1, minCharge: 30, temperMultiplier: 1.8, custom: true }]);
  const removeType = (id: string) => setTypes((ts) => ts.filter((t) => t.id !== id));
  const resetRates = () => { setTypes(DEFAULT_GLASS_TYPES); setGridRate(DEFAULT_GRID_PRICING.ratePerUI); };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-2 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Glass Replacement</h1>
          <p className="text-slate-500 text-sm">Window &amp; IGU, cut glass, mirrors, storefront — priced by united inch, in your rates.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRates((v) => !v)} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:border-slate-400">
            {showRates ? 'Hide rates' : 'Edit rates'}
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">🖨 Print quote</button>
        </div>
      </div>

      {/* Rate editor */}
      {showRates && (
        <div className="no-print bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-800">Your glass rates <span className="text-xs font-normal text-slate-400">($ per united inch · min charge · tempered ×)</span></h2>
            <div className="flex gap-2">
              <button onClick={addType} className="text-sm text-blue-600 hover:underline">+ Add type</button>
              <button onClick={resetRates} className="text-sm text-slate-400 hover:text-slate-600">Reset</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-2">Glass type</th><th className="py-1 px-2">$/UI</th><th className="py-1 px-2">Min $</th><th className="py-1 px-2">Temper ×</th><th></th></tr></thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="py-1 pr-2"><input value={t.name} onChange={(e) => updateType(t.id, { name: e.target.value })} className="w-56 rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="py-1 px-2"><input type="number" step="0.01" value={t.ratePerUI} onChange={(e) => updateType(t.id, { ratePerUI: parseFloat(e.target.value) || 0 })} className="w-20 rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="py-1 px-2"><input type="number" step="1" value={t.minCharge} onChange={(e) => updateType(t.id, { minCharge: parseFloat(e.target.value) || 0 })} className="w-20 rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="py-1 px-2"><input type="number" step="0.1" value={t.temperMultiplier} onChange={(e) => updateType(t.id, { temperMultiplier: parseFloat(e.target.value) || 1 })} className="w-16 rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="py-1"><button onClick={() => removeType(t.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <span>Grid upcharge $/united inch:</span>
            <input type="number" step="0.05" value={gridRate} onChange={(e) => setGridRate(parseFloat(e.target.value) || 0)} className="w-20 rounded border border-slate-300 px-2 py-1" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Starter rates are examples — edit them to your pricing. Saved on this device.</p>
        </div>
      )}

      {/* Job header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Customer / job</label>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Smith residence — kitchen window" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="no-print">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tax %</label>
          <input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">{companyName}</div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="py-2 px-3">Glass type</th>
                <th className="py-2 px-2">Shape</th>
                <th className="py-2 px-2">Width</th>
                <th className="py-2 px-2">Height / minor</th>
                <th className="py-2 px-2">Qty</th>
                <th className="py-2 px-2 text-center">Temp</th>
                <th className="py-2 px-2">Grid</th>
                <th className="py-2 px-2 text-right">UI</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-2 no-print"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const w = fromInches(l.width);
                const h = fromInches(l.height);
                const isCircle = l.shape === 'circle';
                return (
                  <tr key={l.id} className="border-t border-slate-100 align-top">
                    <td className="py-2 px-3">
                      <select value={l.typeId} onChange={(e) => updateLine(l.id, { typeId: e.target.value })} className="rounded border border-slate-300 px-2 py-1 max-w-[200px]">
                        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <input value={l.note || ''} onChange={(e) => updateLine(l.id, { note: e.target.value })} placeholder="location / note" className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 no-print" />
                    </td>
                    <td className="py-2 px-2">
                      <select value={l.shape} onChange={(e) => updateLine(l.id, { shape: e.target.value as Shape })} className="rounded border border-slate-300 px-2 py-1">
                        {SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} value={w.whole} onChange={(e) => updateLine(l.id, { width: toInches(parseInt(e.target.value) || 0, w.sixteenth) })} className="w-14 rounded border border-slate-300 px-1 py-1" />
                        <select value={w.sixteenth} onChange={(e) => updateLine(l.id, { width: toInches(w.whole, parseFloat(e.target.value)) })} className="rounded border border-slate-300 px-1 py-1">
                          {SIXTEENTHS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <span className="text-slate-400 text-xs">in</span>
                      </div>
                      {isCircle && <div className="text-[10px] text-slate-400 mt-0.5">diameter</div>}
                    </td>
                    <td className="py-2 px-2">
                      {isCircle ? <span className="text-slate-300 text-xs">—</span> : (
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} value={h.whole} onChange={(e) => updateLine(l.id, { height: toInches(parseInt(e.target.value) || 0, h.sixteenth) })} className="w-14 rounded border border-slate-300 px-1 py-1" />
                          <select value={h.sixteenth} onChange={(e) => updateLine(l.id, { height: toInches(h.whole, parseFloat(e.target.value)) })} className="rounded border border-slate-300 px-1 py-1">
                            {SIXTEENTHS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <span className="text-slate-400 text-xs">in</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2"><input type="number" min={1} value={l.qty} onChange={(e) => updateLine(l.id, { qty: parseInt(e.target.value) || 1 })} className="w-14 rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="py-2 px-2 text-center"><input type="checkbox" checked={l.tempered} onChange={(e) => updateLine(l.id, { tempered: e.target.checked })} /></td>
                    <td className="py-2 px-2">
                      <select value={l.grid} onChange={(e) => updateLine(l.id, { grid: e.target.value as GridSize })} className="rounded border border-slate-300 px-2 py-1">
                        {GRIDS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-500">{unitedInches(l)}"</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">{money(lineTotals[i])}</td>
                    <td className="py-2 px-2 no-print"><button onClick={() => removeLine(l.id)} className="text-red-400 hover:text-red-600">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 no-print">
          <button onClick={addLine} className="text-sm text-blue-600 font-medium hover:underline">+ Add glass</button>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-full max-w-xs bg-white rounded-xl border border-slate-200 p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Subtotal</span><span className="font-medium">{money(totals.subtotal)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Tax ({totals.taxRate}%)</span><span className="font-medium">{money(totals.taxAmount)}</span></div>
          <div className="flex justify-between py-2 border-t border-slate-200 mt-1"><span className="font-semibold text-slate-900">Total</span><span className="font-bold text-lg text-slate-900">{money(totals.total)}</span></div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4 no-print">
        Estimate only — confirm all sizes by field measurement. See the Disclaimer. Sizes round up to the next inch for united-inch pricing.
      </p>
    </div>
  );
}
