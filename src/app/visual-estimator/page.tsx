'use client'; import { useEffect, useRef, useState } from 'react';

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
  const [scale, setScale] = useState(20);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [activeStyle, setActiveStyle] = useState('frameless-half');
  const [activeTool, setActiveTool] = useState<'line'|'erase'>('line');
  const [drawing, setDrawing] = useState<{ x1: number; y1: number } | null>(null);
  const [scaleRef, setScaleRef] = useState<{ x1: number; y1: number; x2: number; y2: number; length: number } | null>(null);
  const [pixelsPerFoot, setPixelsPerFoot] = useState(0);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (activeTool === 'line') setDrawing({ x1: x, y1: y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    if (Math.abs(x2 - drawing.x1) < 5 && Math.abs(y2 - drawing.y1) < 5) { setDrawing(null); return; }
    const pixels = Math.sqrt((x2 - drawing.x1) ** 2 + (y2 - drawing.y1) ** 2);
    const lengthFt = pixelsPerFoot > 0 ? Math.round(pixels / pixelsPerFoot * 100) / 100 : 0;
    setWalls([...walls, { id: Date.now(), x1: drawing.x1, y1: drawing.y1, x2, y2, wallStyle: activeStyle, lengthFt }]);
    setDrawing(null);
  };

  const handleSetScale = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!scaleRef) { setScaleRef({ x1: x, y1: y, x2: 0, y2: 0, length: 0 }); return; }
    if (!scaleRef.x2) {
      const px = Math.sqrt((x - scaleRef.x1) ** 2 + (y - scaleRef.y1) ** 2);
      const ft = window.prompt('Enter real-world length (feet):', '10');
      if (!ft) { setScaleRef(null); return; }
      const l = parseFloat(ft);
      if (isNaN(l) || l <= 0) { setScaleRef(null); return; }
      setPixelsPerFoot(px / l);
      setScaleRef({ ...scaleRef, x2: x, y2: y, length: l });
    }
  };

  const removeWall = (id: number) => setWalls(walls.filter((w) => w.id !== id));

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (photo) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const wall of walls) {
        const style = WALL_STYLES.find((s) => s.id === wall.wallStyle);
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.strokeStyle = style?.color || '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
        const mx = (wall.x1 + wall.x2) / 2, my = (wall.y1 + wall.y2) / 2;
        ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif';
        if (wall.lengthFt > 0) {
          const label = `${wall.lengthFt.toFixed(1)} ft`;
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(mx - tw / 2 - 4, my - 18, tw + 8, 18);
          ctx.fillStyle = '#fff'; ctx.fillText(label, mx - tw / 2, my - 4);
        }
      }
      if (drawing) {
        ctx.beginPath(); ctx.moveTo(drawing.x1, drawing.y1);
        ctx.lineTo(drawing.x1, drawing.y1);
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (scaleRef) {
        ctx.beginPath(); ctx.moveTo(scaleRef.x1, scaleRef.y1);
        if (scaleRef.x2) ctx.lineTo(scaleRef.x2, scaleRef.y2);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();
        if (scaleRef.length > 0) ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`${scaleRef.length} ft`, (scaleRef.x1 + scaleRef.x2) / 2, (scaleRef.y1 + scaleRef.y2) / 2 - 8);
      }
    };
    if (photo) { img.onload = render; img.src = photo; } else render();
  }, [photo, walls, drawing, scaleRef]);

  const totals = WALL_STYLES.map((style) => {
    const ft = walls.filter((w) => w.wallStyle === style.id).reduce((s, w) => s + w.lengthFt, 0);
    return { ...style, totalFt: ft, totalPrice: ft * style.pricePerFt };
  }).filter((t) => t.totalFt > 0);

  const grandTotal = totals.reduce((s, t) => s + t.totalPrice, 0);
  const totalLinearFt = totals.reduce((s, t) => s + t.totalFt, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Visual Estimator</h1>
        <div className="flex gap-2">
          <label className="btn-secondary btn-sm cursor-pointer"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />📷 Upload Photo</label>
          <button onClick={() => setScaleRef(null)} className="btn-secondary btn-sm">📏 Set Scale</button>
          <span className="btn-ghost btn-sm text-xs text-slate-500">{pixelsPerFoot > 0 ? `Scale: ${pixelsPerFoot.toFixed(1)}px/ft` : 'No scale set'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h3 className="text-sm font-semibold mb-2">Wall Style</h3>
            {WALL_STYLES.map((style) => (
              <button key={style.id} onClick={() => setActiveStyle(style.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 flex items-center gap-2 ${activeStyle === style.id ? 'bg-navy-100 text-navy-900 font-medium ring-1 ring-navy-500' : 'hover:bg-slate-50 text-slate-700'}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: style.color }} />{style.name}
              </button>
            ))}
          </div>
          <div className="card p-3">
            <h3 className="text-sm font-semibold mb-2">Tools</h3>
            <div className="flex gap-1">
              <button onClick={() => setActiveTool('line')} className={`btn-xs flex-1 ${activeTool === 'line' ? 'btn-primary' : 'btn-secondary'}`}>📏 Wall Line</button>
              <button onClick={() => setActiveTool('erase')} className={`btn-xs flex-1 ${activeTool === 'erase' ? 'btn-primary' : 'btn-secondary'}`}>🗑 Erase</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Click & drag on the photo to draw wall lines. Set scale first with the 📏 button.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <canvas ref={canvasRef} width={700} height={500}
              onMouseDown={scaleRef ? handleSetScale : handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
              className="w-full cursor-crosshair"
              style={{ background: photo ? undefined : '#f1f5f9' }} />
            {!photo && <div className="text-center py-12 text-slate-400"><p className="text-4xl mb-2">📷</p><p>Upload a photo of the work area to begin.</p></div>}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h3 className="text-sm font-semibold mb-2">Estimate Summary</h3>
            {totals.length === 0 ? <p className="text-xs text-slate-400">Draw walls to see estimates.</p> : (
              <div className="space-y-2 text-xs">
                {totals.map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.name}</span>
                    <span className="font-medium">{t.totalFt.toFixed(1)}ft × ${t.pricePerFt}/ft = ${t.totalPrice.toFixed(0)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total: {totalLinearFt.toFixed(1)} ft</span>
                  <span>${grandTotal.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
          {walls.length > 0 && (
            <div className="card p-3">
              <h3 className="text-sm font-semibold mb-2">Walls ({walls.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {walls.map((w) => {
                  const style = WALL_STYLES.find((s) => s.id === w.wallStyle);
                  return (
                    <div key={w.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: style?.color }} />{style?.name.split('(')[0]}</div>
                      <div className="flex items-center gap-2"><span>{w.lengthFt.toFixed(1)}ft</span><button onClick={() => removeWall(w.id)} className="text-red-400 hover:text-red-600">×</button></div>
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
