'use client';

// A lightweight canvas signature pad — the client signs with finger or mouse,
// and we hand back a PNG data URL. No third-party service, works offline on-site.

import { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ onChange, disabled }: { onChange: (dataUrl: string | null) => void; disabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f172a';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const cv = ref.current!; const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drawing.current = true; last.current = pos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || disabled) return;
    const ctx = ref.current!.getContext('2d')!; const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p; if (!hasInk) setHasInk(true);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false; last.current = null;
    if (hasInk && ref.current) onChange(ref.current.toDataURL('image/png'));
  };
  const clear = () => {
    const cv = ref.current; if (!cv) return;
    cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height);
    setHasInk(false); onChange(null);
  };

  return (
    <div>
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={ref} width={600} height={200}
          className="w-full block rounded-lg touch-none"
          style={{ touchAction: 'none', cursor: disabled ? 'not-allowed' : 'crosshair' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        />
        {!hasInk && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm">Sign here</div>}
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[11px] text-slate-400">Draw your signature above</span>
        <button type="button" onClick={clear} disabled={disabled} className="text-[11px] text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline disabled:opacity-40">Clear</button>
      </div>
    </div>
  );
}
