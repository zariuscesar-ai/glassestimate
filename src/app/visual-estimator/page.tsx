'use client'; import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Client { id: number; name: string; }
interface WallSegment { id: number; x1: number; y1: number; x2: number; y2: number; wallStyle: string; lengthFt: number; }
interface DoorConfig { id: number; type: 'single-swing'|'double-swing'|'sliding'|'sliding-stacking'; count: number; }

const WALL_STYLES = [
  { id: 'frameless-half', name: '1/2" Frameless Glass Wall', color: '#3b82f6', pricePerFt: 85, glassThickness: '1/2"', frameType: 'Top & Bottom U-Channel', installHoursPerFt: 0.5 },
  { id: 'frameless-38', name: '3/8" Frameless Glass Wall', color: '#60a5fa', pricePerFt: 65, glassThickness: '3/8"', frameType: 'Top & Bottom U-Channel', installHoursPerFt: 0.4 },
  { id: 'framed', name: 'Framed Glass Partition', color: '#94a3b8', pricePerFt: 55, glassThickness: '1/4"', frameType: 'Aluminum Frame System', installHoursPerFt: 0.3 },
  { id: 'storefront', name: 'Storefront Glass System', color: '#1e40af', pricePerFt: 95, glassThickness: '1/4"', frameType: 'Heavy-Duty Storefront', installHoursPerFt: 0.6 },
  { id: 'floor-ceiling', name: 'Floor-to-Ceiling Glass', color: '#7c3aed', pricePerFt: 95, glassThickness: '1/2"', frameType: 'Base Shoe + Head Channel', installHoursPerFt: 0.6 },
  { id: 'hybrid', name: 'Glass + Sheetrock Hybrid', color: '#78716c', pricePerFt: 45, glassThickness: '3/8"', frameType: 'Metal Stud + U-Channel', installHoursPerFt: 0.5 },
];

const DOOR_OPTIONS = [
  { id: 'single-swing', name: 'Single Frameless Swing Door', price: 2800, icon: '🚪', desc: '36" wide, 1/2" tempered, patch fittings, pull handle, closer, lock' },
  { id: 'double-swing', name: 'Double Frameless Swing Door', price: 4800, icon: '🚪🚪', desc: '72" opening, 1/2" tempered, patch fittings, dual handles, closers, locks' },
  { id: 'sliding', name: 'Single Sliding Glass Door', price: 4200, icon: '🪟', desc: 'Top-hung track, soft-close, flush pulls, 48" panel' },
  { id: 'sliding-stacking', name: 'Stacking Sliding Doors (3-panel)', price: 8500, icon: '🪟🪟🪟', desc: 'Top-hung track, soft-close, 3 panels, multi-directional' },
];

export default function VisualEstimatorPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Client & estimate info
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');

  // Canvas state
  const [photo, setPhoto] = useState<string | null>(null);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [activeStyle, setActiveStyle] = useState('frameless-half');
  const [activeTool, setActiveTool] = useState<'line'|'erase'>('line');
  const [drawing, setDrawing] = useState<{ x1: number; y1: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [scaleMode, setScaleMode] = useState(false);
  const [scaleStart, setScaleStart] = useState<{ x: number; y: number } | null>(null);
  const [scaleEnd, setScaleEnd] = useState<{ x: number; y: number } | null>(null);
  const [pixelsPerFoot, setPixelsPerFoot] = useState(0);

  // Doors
  const [doors, setDoors] = useState<DoorConfig[]>([]);

  // Saving
  const [saving, setSaving] = useState(false);

  // Load clients
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { if (Array.isArray(d)) setClients(d); }).catch(() => {});
  }, []);

  const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { const c = canvasRef.current; if (c) { c.width = Math.min(img.width, 800); c.height = (img.height / img.width) * c.width; } setPhoto(reader.result as string); }; img.src = reader.result as string; };
    reader.readAsDataURL(f);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoords(e);
    if (scaleMode) {
      if (!scaleStart) { setScaleStart({ x, y }); setScaleEnd(null); return; }
      setScaleEnd({ x, y });
      const px = Math.sqrt((x - scaleStart.x) ** 2 + (y - scaleStart.y) ** 2);
      const ft = parseFloat(prompt('How many feet is this line?', '10') || '0');
      if (ft > 0) { setPixelsPerFoot(px / ft); }
      setScaleMode(false); setScaleStart(null); setScaleEnd(null); return;
    }
    if (activeTool === 'line') setDrawing({ x1: x, y1: y });
    if (activeTool === 'erase') {
      const near = walls.find(w => Math.sqrt(((w.x1+w.x2)/2 - x)**2 + ((w.y1+w.y2)/2 - y)**2) < 20);
      if (near) setWalls(walls.filter(w => w.id !== near.id));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoords(e); setCursorPos({ x, y });
    if (scaleMode && scaleStart) setScaleEnd({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return; const { x: x2, y: y2 } = getCoords(e);
    const dist = Math.sqrt((x2 - drawing.x1) ** 2 + (y2 - drawing.y1) ** 2);
    if (dist < 8) { setDrawing(null); return; }
    const len = pixelsPerFoot > 0 ? Math.round(dist / pixelsPerFoot * 100) / 100 : 0;
    setWalls([...walls, { id: Date.now(), x1: drawing.x1, y1: drawing.y1, x2, y2, wallStyle: activeStyle, lengthFt: len }]);
    setDrawing(null);
  };

  const addDoor = (type: DoorConfig['type']) => {
    setDoors(prev => {
      const existing = prev.find(d => d.type === type);
      if (existing) return prev.map(d => d.type === type ? { ...d, count: d.count + 1 } : d);
      return [...prev, { id: Date.now(), type, count: 1 }];
    });
  };

  const removeDoor = (id: number) => setDoors(prev => {
    const d = prev.find(x => x.id === id);
    if (!d) return prev;
    if (d.count > 1) return prev.map(x => x.id === id ? { ...x, count: x.count - 1 } : x);
    return prev.filter(x => x.id !== id);
  });

  const removeWall = (id: number) => setWalls(walls.filter(w => w.id !== id));
  const clearAll = () => { if (confirm('Clear everything?')) { setWalls([]); setDoors([]); } };

  // Canvas render
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const img = new Image();
    const render = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      if (photo) ctx.drawImage(img, 0, 0, c.width, c.height);
      for (const w of walls) {
        const s = WALL_STYLES.find(x => x.id === w.wallStyle);
        ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2);
        ctx.strokeStyle = s?.color || '#000'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
        if (w.lengthFt > 0) {
          const mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2;
          const label = `${w.lengthFt.toFixed(1)}ft`;
          ctx.font = 'bold 11px sans-serif'; const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(mx - tw/2 - 5, my - 19, tw + 10, 18);
          ctx.fillStyle = '#fff'; ctx.fillText(label, mx - tw/2, my - 5);
        }
      }
      if (drawing && cursorPos) {
        ctx.beginPath(); ctx.moveTo(drawing.x1, drawing.y1); ctx.lineTo(cursorPos.x, cursorPos.y);
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.setLineDash([8,4]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (scaleStart) { ctx.beginPath(); ctx.moveTo(scaleStart.x, scaleStart.y); const ex = scaleEnd || cursorPos || scaleStart; ctx.lineTo(ex.x, ex.y); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([6,3]); ctx.stroke(); ctx.setLineDash([]); }
    };
    if (photo) { img.onload = render; img.src = photo; } else render();
  }, [photo, walls, drawing, cursorPos, scaleStart, scaleEnd]);

  // Calculations
  const totals = WALL_STYLES.map(s => {
    const ft = walls.filter(w => w.wallStyle === s.id).reduce((sum, w) => sum + w.lengthFt, 0);
    return { ...s, totalFt: ft, wallCost: ft * s.pricePerFt, laborHours: ft * s.installHoursPerFt };
  }).filter(t => t.totalFt > 0);

  const wallTotal = totals.reduce((s, t) => s + t.wallCost, 0);
  const laborHours = totals.reduce((s, t) => s + t.laborHours, 0);
  const laborCost = laborHours * 65; // $65/hr avg labor
  const doorTotal = doors.reduce((s, d) => { const opt = DOOR_OPTIONS.find(o => o.id === d.type); return s + (opt?.price || 0) * d.count; }, 0);
  const totalFt = totals.reduce((s, t) => s + t.totalFt, 0);
  const grandTotal = wallTotal + laborCost + doorTotal;
  const tax = grandTotal * 0.0825;
  const totalWithTax = grandTotal + tax;

  const fmt = (n: number) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); } catch { return '$0.00'; } };

  const handleCreateEstimate = async () => {
    if (!clientId) { alert('Please select a client first.'); return; }
    if (walls.length === 0) { alert('Draw at least one wall on the photo.'); return; }
    setSaving(true);
    try {
      // Build line items from walls + doors
      const items: { description: string; quantity: number; unit_price: number }[] = [];
      for (const t of totals) {
        items.push({ description: `${t.name} (${t.glassThickness} glass, ${t.frameType})`, quantity: Math.round(t.totalFt * 100) / 100, unit_price: t.pricePerFt });
      }
      if (laborHours > 0) {
        items.push({ description: 'Installation Labor — all glass systems', quantity: Math.round(laborHours * 10) / 10, unit_price: 65 });
      }
      for (const d of doors) {
        const opt = DOOR_OPTIONS.find(o => o.id === d.type);
        if (opt) items.push({ description: `${opt.name} — ${opt.desc}`, quantity: d.count, unit_price: opt.price });
      }
      items.push({ description: 'Project management, permits, cleanup, disposal', quantity: 1, unit_price: Math.round(grandTotal * 0.05) });

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(clientId),
          issue_date: today, due_date: dueDate,
          type: 'estimate',
          items,
          tax_rate: 8.25,
          notes: notes || `Visual estimate for ${projectName || 'glass installation project'}. Includes ${totalFt.toFixed(1)} linear feet of glass walls, ${doors.reduce((s,d) => s + d.count, 0)} door(s).`,
          terms: 'Estimate valid for 30 days. 50% deposit required to begin fabrication.',
        }),
      });
      if (!res.ok) { const er = await res.json(); alert(er.error || 'Failed'); return; }
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } catch { alert('Error creating estimate.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Visual Estimator + Estimate</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-primary btn-sm cursor-pointer"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />📷 Upload Photo</label>
          <button onClick={() => { setScaleMode(!scaleMode); setScaleStart(null); setScaleEnd(null); }} className={`btn-sm ${scaleMode ? 'btn-primary' : 'btn-secondary'}`}>📏 {scaleMode ? 'Click 2 points...' : 'Set Scale'}</button>
          {pixelsPerFoot > 0 && <span className="btn-ghost btn-sm text-xs text-green-600 font-medium">✓ {pixelsPerFoot.toFixed(1)}px/ft</span>}
          {(walls.length > 0 || doors.length > 0) && <button onClick={clearAll} className="btn-ghost btn-sm text-red-500">Clear All</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT PANEL: Client + Doors */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Client</h2>
            <select className="select text-sm" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input text-sm mt-2" placeholder="Project name (optional)" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Door Systems</h2>
            <p className="text-xs text-slate-400 mb-2">Add doors to your walls:</p>
            <div className="space-y-1 mb-2">
              {DOOR_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => addDoor(opt.type)} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-slate-50 border border-slate-200 flex justify-between">
                  <span>{opt.icon} {opt.name}</span><span className="font-medium text-slate-600">{fmt(opt.price)}</span>
                </button>
              ))}
            </div>
            {doors.length > 0 && (
              <div className="border-t border-slate-200 pt-2">
                <p className="text-xs font-medium mb-1">Added Doors:</p>
                {doors.map(d => {
                  const opt = DOOR_OPTIONS.find(o => o.id === d.type);
                  return (
                    <div key={d.id} className="flex items-center justify-between text-xs py-0.5">
                      <span>{opt?.icon} {opt?.name} ×{d.count}</span>
                      <button onClick={() => removeDoor(d.id)} className="text-red-400 font-bold">×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Wall Style</h2>
            {WALL_STYLES.map(s => (
              <button key={s.id} onClick={() => { setActiveStyle(s.id); setActiveTool('line'); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 flex items-center gap-2 ${activeStyle === s.id ? 'bg-navy-100 text-navy-900 font-medium ring-1 ring-navy-500' : 'hover:bg-slate-50 text-slate-700'}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />{s.name} <span className="ml-auto text-slate-400">{fmt(s.pricePerFt)}/ft</span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden border-2 border-slate-200">
            {!photo ? (
              <div className="text-center py-24 cursor-pointer" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
                <p className="text-5xl mb-3">📷</p>
                <p className="text-slate-500 font-medium">Upload a photo of the work area</p>
                <p className="text-slate-400 text-sm mt-1">Office, lobby, storefront, etc.</p>
                <p className="text-slate-300 text-xs mt-2">JPG, PNG, or HEIC</p>
                <label className="btn-primary btn-sm mt-4 cursor-pointer inline-block"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />Choose Photo</label>
              </div>
            ) : (
              <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setDrawing(null); setCursorPos(null); }} className="w-full cursor-crosshair block" />
            )}
          </div>
          {photo && (
            <div className="flex gap-3 mt-2 justify-center">
              <button onClick={() => setActiveTool('line')} className={`btn-xs ${activeTool === 'line' ? 'btn-primary' : 'btn-secondary'}`}>📏 Draw Wall</button>
              <button onClick={() => setActiveTool('erase')} className={`btn-xs ${activeTool === 'erase' ? 'btn-primary' : 'btn-secondary'}`}>🗑 Erase</button>
              <span className="text-xs text-slate-500 self-center">
                {pixelsPerFoot === 0 ? '⚠ Set scale first' : `Drawing: ${WALL_STYLES.find(s => s.id === activeStyle)?.name}`}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Estimate Summary */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Estimate Breakdown</h2>
            {totals.length === 0 && doors.length === 0 ? (
              <p className="text-xs text-slate-400">Upload a photo, set scale, and draw walls to generate an estimate.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {totals.map(t => (
                  <div key={t.id} className="flex justify-between border-b border-slate-100 pb-1">
                    <div><span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: t.color }} />{t.name}</div>
                    <div className="font-medium">{t.totalFt.toFixed(1)}ft · {fmt(t.wallCost)}</div>
                  </div>
                ))}
                {doors.map(d => { const opt = DOOR_OPTIONS.find(o => o.id === d.type); if (!opt) return null; return (
                  <div key={d.id} className="flex justify-between border-b border-slate-100 pb-1"><span>{opt.icon} {opt.name} ×{d.count}</span><span className="font-medium">{fmt(opt.price * d.count)}</span></div>
                );})}
                <div className="flex justify-between"><span className="text-slate-500">Materials</span><span>{fmt(wallTotal + doorTotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Labor ({laborHours.toFixed(1)}hrs)</span><span>{fmt(laborCost)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tax (8.25%)</span><span>{fmt(tax)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Estimate Total</span><span>{fmt(totalWithTax)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Notes</h2>
            <textarea className="input text-xs" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Project notes, special instructions..." />
          </div>

          <button onClick={handleCreateEstimate} className="btn-primary w-full" disabled={saving || !clientId || walls.length === 0}>
            {saving ? 'Creating...' : '📋 Create Estimate'}
          </button>

          {walls.length > 0 && (
            <div className="card p-3">
              <h2 className="text-sm font-semibold mb-2">Walls ({walls.length})</h2>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {walls.map((w, i) => { const s = WALL_STYLES.find(st => st.id === w.wallStyle); return (
                  <div key={w.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5"><span className="text-slate-400 font-mono">{i+1}.</span><span className="w-2 h-2 rounded-full" style={{ background: s?.color }} /><span className="truncate max-w-[100px]">{s?.name}</span></div>
                    <div className="flex items-center gap-2 shrink-0"><span className="font-medium">{w.lengthFt > 0 ? `${w.lengthFt.toFixed(1)}ft` : '—'}</span><button onClick={() => removeWall(w.id)} className="text-red-400 font-bold">×</button></div>
                  </div>
                );})}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
