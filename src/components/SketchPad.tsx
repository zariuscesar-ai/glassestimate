"use client";

// Finger-sketch pad: the dealer draws the top-down outline of the shower walls
// with a finger (iPad) or mouse; on release the stroke is cleaned (simplify →
// snap to 0/45/90 → merge) and classified into a shower system with proportional
// wall widths. "Use this system" hands the result back to the configurator.

import { useRef, useState } from "react";
import { classify, cleanStroke, type Pt, type SketchResult } from "@/lib/shower/sketch";

const W = 600, H = 360;

export default function SketchPad({ onApply, onClose }: { onApply: (r: SketchResult) => void; onClose?: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<SketchResult | null>(null);

  const toLocal = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = toLocal(e); setPts([p]); setDrawing(true); setResult(null);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = toLocal(e);
    setPts((l) => (l.length && Math.hypot(p.x - l[l.length - 1].x, p.y - l[l.length - 1].y) < 3 ? l : [...l, p]));
  };
  const up = () => {
    if (!drawing) return;
    setDrawing(false);
    setPts((l) => { if (l.length >= 2) setResult(classify(l)); return l; });
  };
  const clear = () => { setPts([]); setResult(null); };

  const rawPath = pts.length ? "M " + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";
  const clean = result?.corners || (pts.length >= 2 && !drawing ? cleanStroke(pts) : []);
  const cleanPath = clean.length >= 2 ? "M " + clean.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";

  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-500">Draw the top-down outline of the walls with your finger — one continuous line. We snap it to clean 90°/45° walls and pick the system.</p>
        {onClose && <button type="button" onClick={onClose} className="text-[11px] text-slate-400 hover:text-slate-600 ml-2">Close</button>}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-slate-200 select-none"
        style={{ touchAction: "none", background: "#f8fafc", cursor: "crosshair", aspectRatio: `${W} / ${H}` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        role="img" aria-label="Sketch the shower opening"
      >
        {/* faint grid */}
        {Array.from({ length: Math.floor(W / 30) + 1 }, (_, i) => (
          <line key={"v" + i} x1={i * 30} y1={0} x2={i * 30} y2={H} stroke="#e2e8f0" strokeWidth={0.5} />
        ))}
        {Array.from({ length: Math.floor(H / 30) + 1 }, (_, i) => (
          <line key={"h" + i} x1={0} y1={i * 30} x2={W} y2={i * 30} stroke="#e2e8f0" strokeWidth={0.5} />
        ))}
        {rawPath && <path d={rawPath} fill="none" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={result ? "4 4" : undefined} />}
        {cleanPath && <path d={cleanPath} fill="none" stroke="#0f766e" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        {clean.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5} fill="#0f766e" />)}
        {!pts.length && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={16} fill="#cbd5e1">✏️ draw here</text>}
      </svg>
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <div className="text-sm">
          {result
            ? <span className="text-slate-700">Detected: <b className="text-emerald-700">{result.detected}</b> <span className="text-slate-400">· walls {result.widthsIn.join('" / ')}"</span></span>
            : <span className="text-slate-400">Draw an outline, then apply.</span>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={clear} className="text-xs rounded-lg border border-slate-300 text-slate-600 px-2.5 py-1 hover:bg-slate-50">Clear</button>
          <button type="button" disabled={!result} onClick={() => result && onApply(result)}
            className="text-xs rounded-lg bg-emerald-600 text-white px-3 py-1 hover:bg-emerald-700 disabled:opacity-50">Use this system →</button>
        </div>
      </div>
    </div>
  );
}
