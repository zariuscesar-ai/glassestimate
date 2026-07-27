'use client'; import { useState } from 'react';

type Shape = 'rectangle' | 'circle' | 'triangle' | 'trapezoid' | 'oval';

const SHAPES: { id: Shape; name: string; icon: string; desc: string }[] = [
  { id: 'rectangle', name: 'Rectangle', icon: '▬', desc: 'Standard glass panels, windows, doors' },
  { id: 'circle', name: 'Circle', icon: '●', desc: 'Round windows, portholes, tabletops' },
  { id: 'triangle', name: 'Triangle', icon: '▲', desc: 'Gable glass, angled panels' },
  { id: 'trapezoid', name: 'Trapezoid', icon: '⏢', desc: 'Sloped walls, custom storefront tops' },
  { id: 'oval', name: 'Oval / Ellipse', icon: '⬮', desc: 'Oval windows, decorative mirrors' },
];

export default function ShapeCalculator() {
  // Load saved prices from localStorage or use defaults
  const loadPrices = () => {
    try { const saved = localStorage.getItem('glassPrices'); if (saved) return JSON.parse(saved); } catch {}
    return { temperedHalf: '28', tempered38: '22', tempered14: '16', lowIron: '38', laminated: '32', mirror: '18', igUnit: '42', laborPerHr: '65' };
  };
  const [myPrices, setMyPrices] = useState(loadPrices);
  const savePrices = (p: typeof myPrices) => { setMyPrices(p); localStorage.setItem('glassPrices', JSON.stringify(p)); };

  const [shape, setShape] = useState<Shape>('rectangle');
  const [w, setW] = useState('');  // width / base
  const [h, setH] = useState('');  // height
  const [w2, setW2] = useState(''); // top width (trapezoid)
  const [d, setD] = useState('');   // diameter (circle)
  const [d2, setD2] = useState(''); // minor diameter (oval)
  const [pricePerSqFt, setPricePerSqFt] = useState('28');
  const [waste, setWaste] = useState('15');

  const calc = () => {
    let sqFt = 0;
    switch (shape) {
      case 'rectangle': sqFt = (parseFloat(w) || 0) * (parseFloat(h) || 0) / 144; break;
      case 'circle': sqFt = Math.PI * ((parseFloat(d) || 0) / 2) ** 2 / 144; break;
      case 'triangle': sqFt = ((parseFloat(w) || 0) * (parseFloat(h) || 0) / 2) / 144; break;
      case 'trapezoid': sqFt = (((parseFloat(w) || 0) + (parseFloat(w2) || 0)) / 2) * (parseFloat(h) || 0) / 144; break;
      case 'oval': sqFt = Math.PI * ((parseFloat(d) || 0) / 2) * ((parseFloat(d2) || 0) / 2) / 144; break;
    }
    const wasteFactor = 1 + (parseFloat(waste) || 0) / 100;
    const totalSqFt = sqFt * wasteFactor;
    const price = totalSqFt * (parseFloat(pricePerSqFt) || 0);
    return { sqFt, totalSqFt, price, perimeter: 0 };
  };

  const result = calc();
  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  const renderFields = () => {
    switch (shape) {
      case 'rectangle':
        return <div className="grid grid-cols-2 gap-3"><div><label className="label text-xs">Width (inches)</label><input className="input text-sm" type="number" step="0.125" value={w} onChange={e => setW(e.target.value)} placeholder="36" /></div><div><label className="label text-xs">Height (inches)</label><input className="input text-sm" type="number" step="0.125" value={h} onChange={e => setH(e.target.value)} placeholder="96" /></div></div>;
      case 'circle':
        return <div><label className="label text-xs">Diameter (inches)</label><input className="input text-sm" type="number" step="0.125" value={d} onChange={e => setD(e.target.value)} placeholder="48" /></div>;
      case 'triangle':
        return <div className="grid grid-cols-2 gap-3"><div><label className="label text-xs">Base (inches)</label><input className="input text-sm" type="number" step="0.125" value={w} onChange={e => setW(e.target.value)} placeholder="48" /></div><div><label className="label text-xs">Height (inches)</label><input className="input text-sm" type="number" step="0.125" value={h} onChange={e => setH(e.target.value)} placeholder="36" /></div></div>;
      case 'trapezoid':
        return <div className="space-y-2"><div className="grid grid-cols-2 gap-3"><div><label className="label text-xs">Bottom Width (inches)</label><input className="input text-sm" type="number" step="0.125" value={w} onChange={e => setW(e.target.value)} placeholder="60" /></div><div><label className="label text-xs">Top Width (inches)</label><input className="input text-sm" type="number" step="0.125" value={w2} onChange={e => setW2(e.target.value)} placeholder="36" /></div></div><div><label className="label text-xs">Height (inches)</label><input className="input text-sm" type="number" step="0.125" value={h} onChange={e => setH(e.target.value)} placeholder="48" /></div></div>;
      case 'oval':
        return <div className="grid grid-cols-2 gap-3"><div><label className="label text-xs">Width (inches)</label><input className="input text-sm" type="number" step="0.125" value={d} onChange={e => setD(e.target.value)} placeholder="36" /></div><div><label className="label text-xs">Height (inches)</label><input className="input text-sm" type="number" step="0.125" value={d2} onChange={e => setD2(e.target.value)} placeholder="24" /></div></div>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Glass Shape Calculator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Shape</h2>
            <div className="grid grid-cols-5 gap-2">
              {SHAPES.map(s => (
                <button key={s.id} onClick={() => setShape(s.id)}
                  className={`p-3 rounded-lg text-center border-2 transition-colors ${shape === s.id ? 'border-navy-500 bg-navy-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xs font-medium">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Dimensions</h2>
            <p className="text-xs text-slate-400 mb-3">{SHAPES.find(s => s.id === shape)?.desc}</p>
            {renderFields()}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="label text-xs">Price per sq ft ($)</label><input className="input text-sm" type="number" step="0.01" min="0" value={pricePerSqFt} onChange={e => setPricePerSqFt(e.target.value)} /></div>
              <div><label className="label text-xs">Waste factor (%)</label><input className="input text-sm" type="number" step="1" min="0" max="50" value={waste} onChange={e => setWaste(e.target.value)} /></div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Cut List</h2>
            {result.sqFt > 0 ? (
              <div className="text-sm space-y-1">
                <p><strong>Net area:</strong> {result.sqFt.toFixed(2)} sq ft</p>
                <p><strong>Waste ({waste}%):</strong> +{(result.totalSqFt - result.sqFt).toFixed(2)} sq ft</p>
                <p><strong>Total material:</strong> {result.totalSqFt.toFixed(2)} sq ft</p>
                <p className="text-xs text-slate-400 mt-2">Edge finishing: add $2-4 per linear foot for polished edges</p>
              </div>
            ) : <p className="text-slate-400 text-sm">Enter dimensions to see calculations.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 bg-navy-50 border-navy-200">
            <h2 className="text-lg font-bold text-navy-900 mb-3">Price Estimate</h2>
            <div className="text-center">
              <p className="text-4xl font-bold text-navy-900">{fmt(result.price)}</p>
              <p className="text-sm text-slate-500 mt-1">for {result.totalSqFt.toFixed(2)} sq ft</p>
              <p className="text-xs text-slate-400 mt-1">at {fmt(parseFloat(pricePerSqFt) || 0)}/sq ft</p>
            </div>
            <button
              onClick={() => {
                const text = `Glass panel: ${SHAPES.find(s => s.id === shape)?.name}, ${result.totalSqFt.toFixed(1)} sq ft @ ${fmt(parseFloat(pricePerSqFt) || 0)}/sq ft = ${fmt(result.price)}`;
                navigator.clipboard.writeText(text);
                alert('Copied to clipboard! Paste into invoice line items.');
              }}
              className="btn-secondary btn-sm w-full mt-4"
            >📋 Copy to Clipboard</button>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">My Price List <span className="text-green-500">(editable)</span></h3>
            <div className="space-y-2 text-xs">
              {[
                { key: 'temperedHalf', label: '½" Tempered', unit: 'sq ft' },
                { key: 'tempered38', label: '⅜" Tempered', unit: 'sq ft' },
                { key: 'tempered14', label: '¼" Tempered', unit: 'sq ft' },
                { key: 'lowIron', label: '½" Low-Iron', unit: 'sq ft' },
                { key: 'laminated', label: '½" Laminated', unit: 'sq ft' },
                { key: 'mirror', label: '¼" Mirror', unit: 'sq ft' },
                { key: 'igUnit', label: '1" IGU (insulated)', unit: 'sq ft' },
                { key: 'laborPerHr', label: 'Installation Labor', unit: 'hour' },
              ].map(({ key, label, unit }) => (
                <div key={key} className="flex items-center gap-2 justify-between">
                  <span className="text-slate-600">{label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">$</span>
                    <input
                      className="w-16 text-right border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-400"
                      type="number" step="0.01" min="0"
                      value={(myPrices as any)[key]}
                      onChange={e => savePrices({ ...myPrices, [key]: e.target.value })}
                    />
                    <span className="text-slate-400 text-[10px]">/{unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Prices saved to your browser. Update anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
