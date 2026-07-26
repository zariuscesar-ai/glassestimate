'use client'; import { useEffect, useRef, useState, useCallback } from 'react';

interface WallSegment { id: number; x1: number; y1: number; x2: number; y2: number; wallStyle: string; lengthFt: number; }

const WALL_STYLES = [
  { id: 'frameless-half', name: '1/2" Frameless (U-Channel)', color: '#3b82f6', pricePerFt: 85, glassThickness: '1/2"', frameType: 'Top & Bottom Channel' },
  { id: 'frameless-38', name: '3/8" Frameless (U-Channel)', color: '#60a5fa', pricePerFt: 65, glassThickness: '3/8"', frameType: 'Top & Bottom Channel' },
  { id: 'framed', name: 'Framed Glass Partition', color: '#94a3b8', pricePerFt: 55, glassThickness: '1/4"', frameType: 'Aluminum Frame' },
  { id: 'storefront', name: 'Storefront System', color: '#1e40af', pricePerFt: 95, glassThickness: '1/4"', frameType: 'Storefront Frame' },
  { id: 'sheetrock', name: 'Sheetrock Wall', color: '#78716c', pricePerFt: 25, glassThickness: 'N/A', frameType: 'Metal Studs' },
];

export default function VisualEstimatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Scale mouse coords from display size to canvas intrinsic size
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to match image aspect ratio but cap at 800px wide
        const maxW = 800;
        const w = Math.min(img.width, maxW);
        const h = (img.height / img.width) * w;
        const canvas = canvasRef.current;
        if (canvas) { canvas.width = w; canvas.height = h; }
        setPhoto(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    if (scaleMode) {
      if (!scaleStart) { setScaleStart({ x, y }); setScaleEnd(null); return; }
      // Second click: finish scale line
      setScaleEnd({ x, y });
      const px = Math.sqrt((x - scaleStart.x) ** 2 + (y - scaleStart.y) ** 2);
      const ft = parseFloat(window.prompt('How many feet is this line?', '10') || '0');
      if (ft > 0) { setPixelsPerFoot(px / ft); }
      setScaleMode(false); setScaleStart(null); setScaleEnd(null);
      return;
    }
    if (activeTool === 'line') setDrawing({ x1: x, y1: y });
    if (activeTool === 'erase') {
      // Find and remove wall near click
      const near = walls.find((w) => {
        const cx = (w.x1 + w.x2) / 2, cy = (w.y1 + w.y2) / 2;
        return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 20;
      });
      if (near) setWalls(walls.filter((w) => w.id !== near.id));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setCursorPos({ x, y });
    if (scaleMode && scaleStart) setScaleEnd({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const { x: x2, y: y2 } = getCanvasCoords(e);
    const dist = Math.sqrt((x2 - drawing.x1) ** 2 + (y2 - drawing.y1) ** 2);
    if (dist < 8) { setDrawing(null); return; }
    const lengthFt = pixelsPerFoot > 0 ? Math.round(dist / pixelsPerFoot * 100) / 100 : 0;
    setWalls([...walls, { id: Date.now(), x1: drawing.x1, y1: drawing.y1, x2, y2, wallStyle: activeStyle, lengthFt }]);
    setDrawing(null);
  };

  const handleMouseLeave = () => { setDrawing(null); setCursorPos(null); };

  const removeWall = (id: number) => setWalls(walls.filter((w) => w.id !== id));

  const clearAll = () => { if (confirm('Remove all walls?')) setWalls([]); };

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const img = new Image();
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (photo) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Draw walls
      for (const wall of walls) {
        const style = WALL_STYLES.find((s) => s.id === wall.wallStyle);
        ctx.beginPath(); ctx.moveTo(wall.x1, wall.y1); ctx.lineTo(wall.x2, wall.y2);
        ctx.strokeStyle = style?.color || '#000'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
        if (wall.lengthFt > 0) {
          const mx = (wall.x1 + wall.x2) / 2, my = (wall.y1 + wall.y2) / 2;
          const label = `${wall.lengthFt.toFixed(1)}ft`;
          ctx.font = 'bold 11px sans-serif';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(mx - tw / 2 - 5, my - 19, tw + 10, 18);
          ctx.fillStyle = '#fff'; ctx.fillText(label, mx - tw / 2, my - 5);
        }
      }
      // Live drawing preview
      if (drawing && cursorPos) {
        ctx.beginPath(); ctx.moveTo(drawing.x1, drawing.y1); ctx.lineTo(cursorPos.x, cursorPos.y);
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.setLineDash([8, 4]); ctx.stroke(); ctx.setLineDash([]);
        const dist = Math.sqrt((cursorPos.x - drawing.x1) ** 2 + (cursorPos.y - drawing.y1) ** 2);
        if (pixelsPerFoot > 0 && dist > 10) {
          const ft = Math.round(dist / pixelsPerFoot * 10) / 10;
          ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#3b82f6';
          const mx = (drawing.x1 + cursorPos.x) / 2, my = (drawing.y1 + cursorPos.y) / 2;
          ctx.fillText(`${ft} ft`, mx + 10, my - 10);
        }
      }
      // Scale line
      if (scaleStart) {
        ctx.beginPath(); ctx.moveTo(scaleStart.x, scaleStart.y);
        const ex = scaleEnd || cursorPos || scaleStart;
        ctx.lineTo(ex.x, ex.y);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    };
    if (photo) { img.onload = render; img.src = photo; } else render();
  }, [photo, walls, drawing, cursorPos, scaleStart, scaleEnd]);

  const totals = WALL_STYLES.map((style) => {
    const ft = walls.filter((w) => w.wallStyle === style.id).reduce((s, w) => s + w.lengthFt, 0);
    return { ...style, totalFt: ft, totalPrice: ft * style.pricePerFt };
  }).filter((t) => t.totalFt > 0);
  const grandTotal = totals.reduce((s, t) => s + t.totalPrice, 0);
  const totalFt = totals.reduce((s, t) => s + t.totalFt, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Visual Estimator</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-primary btn-sm cursor-pointer"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />📷 Upload Photo</label>
          <button onClick={() => { setScaleMode(!scaleMode); setScaleStart(null); setScaleEnd(null); }} className={`btn-sm ${scaleMode ? 'btn-primary' : 'btn-secondary'}`}>📏 {scaleMode ? 'Click 2 points on photo...' : 'Set Scale'}</button>
          {pixelsPerFoot > 0 && <span className="btn-ghost btn-sm text-xs text-green-600 font-medium">✓ Scale: {pixelsPerFoot.toFixed(1)}px/ft</span>}
          {walls.length > 0 && <button onClick={clearAll} className="btn-ghost btn-sm text-red-500">Clear All</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Wall Style</h2>
            {WALL_STYLES.map((s) => (
              <button key={s.id} onClick={() => setActiveStyle(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 flex items-center gap-2 transition-colors ${activeStyle === s.id ? 'bg-navy-100 text-navy-900 font-medium ring-1 ring-navy-500' : 'hover:bg-slate-50 text-slate-700'}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />{s.name}
              </button>
            ))}
          </div>
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Tools</h2>
            <div className="flex gap-1 mb-1">
              <button onClick={() => setActiveTool('line')} className={`btn-xs flex-1 ${activeTool === 'line' ? 'btn-primary' : 'btn-secondary'}`}>📏 Draw Wall</button>
              <button onClick={() => setActiveTool('erase')} className={`btn-xs flex-1 ${activeTool === 'erase' ? 'btn-primary' : 'btn-secondary'}`}>🗑 Erase</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">1. Upload photo<br/>2. Set scale with 📏<br/>3. Pick a wall style<br/>4. Click &amp; drag to draw walls</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden border-2 border-slate-200">
            {!photo ? (
              <div className="text-center py-20 cursor-pointer" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
                <p className="text-5xl mb-3">📷</p>
                <p className="text-slate-500 font-medium">Click here to upload a photo</p>
                <p className="text-slate-400 text-sm mt-1">of the work area (office, lobby, etc.)</p>
                <p className="text-slate-300 text-xs mt-2">JPG, PNG, or HEIC</p>
                <label className="btn-primary btn-sm mt-4 cursor-pointer inline-block"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />Choose Photo</label>
              </div>
            ) : (
              <canvas ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="w-full cursor-crosshair block"
              />
            )}
          </div>
          {photo && <p className="text-xs text-slate-400 mt-2 text-center">📏 Set scale first, then click &amp; drag to draw walls. {activeTool === 'erase' ? 'Click walls to remove them.' : `Current: ${WALL_STYLES.find(s => s.id === activeStyle)?.name}`}</p>}
        </div>

        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Estimate</h2>
            {totals.length === 0 ? (
              <p className="text-xs text-slate-400">Draw walls on the photo to see pricing.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {totals.map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-slate-100 pb-1">
                    <div><span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: t.color }} />{t.name.split('(')[0]}</div>
                    <div className="font-medium">{t.totalFt.toFixed(1)}ft · ${t.totalPrice.toFixed(0)}</div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
                  <span>{totalFt.toFixed(1)} ft total</span>
                  <span>${grandTotal.toFixed(0)}</span>
                </div>
                <p className="text-slate-400 text-xs">* Labor & doors not included</p>
              </div>
            )}
          </div>
          {walls.length > 0 && (
            <div className="card p-3">
              <h2 className="text-sm font-semibold mb-2">Walls ({walls.length})</h2>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {walls.map((w, i) => {
                  const s = WALL_STYLES.find((st) => st.id === w.wallStyle);
                  return (
                    <div key={w.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono">{i + 1}.</span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s?.color }} />
                        <span className="truncate max-w-[120px]">{s?.name.split('(')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium">{w.lengthFt > 0 ? `${w.lengthFt.toFixed(1)}ft` : '—'}</span>
                        <button onClick={() => removeWall(w.id)} className="text-red-400 hover:text-red-600 font-bold">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
