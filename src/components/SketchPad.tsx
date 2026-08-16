"use client";

// Shower opening sketch pad (tap-to-place, Illustrator-style). The dealer taps
// corners for the walls, drags any corner to adjust, and types the exact length
// of each line. It never wipes on a tap, supports undo, keeps the sketch on this
// device, and detects the shower system so it can be added to the enclosure.

import { useEffect, useRef, useState } from "react";
import { classifyRaw, type Pt, type SketchResult } from "@/lib/shower/sketch";

const W = 600, H = 360;
const KEY = "glassestimate:showersketch:v1";
const CLOSE_R = 20;   // how near the first corner counts as "close the loop"

export default function SketchPad({ onApply, onClose }: { onApply: (r: SketchResult) => void; onClose?: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [lensIn, setLensIn] = useState<number[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hover, setHover] = useState<Pt | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [done, setDone] = useState(false);   // shape finished — stops adding points & the cursor preview

  // Restore last sketch (kept on this device) so a tap never loses prior work.
  useEffect(() => {
    try { const raw = window.localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (Array.isArray(d.pts)) setPts(d.pts); if (Array.isArray(d.lensIn)) setLensIn(d.lensIn); } } catch { /* ignore */ }
  }, []);

  const result: SketchResult | null = pts.length >= 2 ? classifyRaw(pts) : null;

  // Is the polyline already a closed loop (first corner === last corner)?
  const isClosed = pts.length >= 3 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y;

  // One editable length per segment; default from the detected proportional
  // widths, but preserve any length the dealer already typed.
  useEffect(() => {
    const need = Math.max(0, pts.length - 1);
    const def = pts.length >= 2 ? classifyRaw(pts).widthsIn : [];
    setLensIn(prev => Array.from({ length: need }, (_, i) => prev[i] ?? def[i] ?? 30));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts.length]);

  const local = (e: React.PointerEvent): Pt => { const r = svgRef.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
  const hitCorner = (p: Pt) => { for (let i = 0; i < pts.length; i++) if (Math.hypot(pts[i].x - p.x, pts[i].y - p.y) <= 14) return i; return -1; };
  const nearFirst = (p: Pt) => pts.length >= 3 && Math.hypot(pts[0].x - p.x, pts[0].y - p.y) <= CLOSE_R;

  const closeLoop = () => { setPts(ps => (ps.length >= 3 ? [...ps, { ...ps[0] }] : ps)); setDone(true); setHover(null); setDragIdx(null); };

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = local(e);
    // 1) While still drawing, a tap on/near the first (green) corner CLOSES the
    //    loop. This is checked BEFORE the corner-drag grab so the first corner
    //    actually closes the shape instead of being picked up for a tiny drag
    //    (the old bug: the cursor got "stuck" on the first dot and never closed).
    if (!done && !isClosed && nearFirst(p)) { closeLoop(); return; }
    // 2) Otherwise, grab any corner to move it (works even after closing).
    const hit = hitCorner(p);
    if (hit >= 0) { setDragIdx(hit); return; }
    // 3) Finished shapes don't add new points.
    if (done) return;
    // 4) Add a corner (never wipes prior work).
    setPts(ps => [...ps, p]);
  };
  const move = (e: React.PointerEvent) => {
    const p = local(e);
    if (dragIdx != null) {
      // Drag a corner. If the loop is closed, the shared first/last corner moves
      // together so the shape stays closed.
      setPts(ps => {
        const closed = ps.length >= 3 && ps[0].x === ps[ps.length - 1].x && ps[0].y === ps[ps.length - 1].y;
        const twin = closed ? (dragIdx === 0 ? ps.length - 1 : dragIdx === ps.length - 1 ? 0 : -1) : -1;
        return ps.map((q, i) => (i === dragIdx || i === twin ? p : q));
      });
      return;
    }
    if (!done) setHover(p);                        // preview only while still drawing
  };
  const up = (e: React.PointerEvent) => { try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ } setDragIdx(null); };
  const leave = () => { setDragIdx(null); setHover(null); };

  // "✓ Done" finishes an OPEN run (door + panel, corner, inline 3-panel); the
  // green first dot is what closes a full loop. Both stop the cursor preview.
  const finish = () => { setDone(true); setHover(null); };
  const reopen = () => setDone(false);
  const undo = () => { setDone(false); setPts(ps => ps.slice(0, -1)); };
  const clear = () => { setPts([]); setLensIn([]); setHover(null); setDone(false); try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } };
  const save = () => { try { window.localStorage.setItem(KEY, JSON.stringify({ pts, lensIn })); setSavedMsg("Saved ✓"); } catch { setSavedMsg("Save failed"); } setTimeout(() => setSavedMsg(""), 1800); };
  const add = () => { if (result) { save(); onApply({ ...result, widthsIn: lensIn.length ? lensIn : result.widthsIn }); } };
  const setLen = (i: number, v: number) => setLensIn(l => l.map((x, j) => (j === i ? v : x)));

  const P = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  const line = pts.length >= 2 ? "M " + pts.map(P).join(" L ") : "";
  const snapClose = !done && !isClosed && !!hover && dragIdx == null && nearFirst(hover);  // hovering over the closing dot
  const previewEnd = snapClose ? pts[0] : hover;   // snap the preview line onto the first corner

  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-500"><b>Tap</b> corners · <b>drag</b> to adjust · tap the <span className="text-emerald-600 font-semibold">green</span> first dot to <b>close the loop</b>, or <b>✓ Done</b> for an open run. Type each line&apos;s length below.</p>
        {onClose && <button type="button" onClick={onClose} className="text-[11px] text-slate-400 hover:text-slate-600 ml-2">Close</button>}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-slate-200 select-none"
        style={{ touchAction: "none", background: "#f8fafc", cursor: "crosshair", aspectRatio: `${W} / ${H}` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={leave}
        role="img" aria-label="Sketch the shower opening"
      >
        {Array.from({ length: Math.floor(W / 30) + 1 }, (_, i) => <line key={"v" + i} x1={i * 30} y1={0} x2={i * 30} y2={H} stroke="#e2e8f0" strokeWidth={0.5} />)}
        {Array.from({ length: Math.floor(H / 30) + 1 }, (_, i) => <line key={"h" + i} x1={0} y1={i * 30} x2={W} y2={i * 30} stroke="#e2e8f0" strokeWidth={0.5} />)}
        {!done && hover && previewEnd && pts.length >= 1 && dragIdx == null &&
          <line x1={pts[pts.length - 1].x} y1={pts[pts.length - 1].y} x2={previewEnd.x} y2={previewEnd.y}
            stroke={snapClose ? "#10b981" : "rgba(37,99,235,0.6)"} strokeWidth={snapClose ? 3 : 2} strokeDasharray="6 4" />}
        {line && <path d={line} fill="none" stroke="#0f766e" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        {pts.slice(0, -1).map((a, i) => { const b = pts[i + 1]; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; return <text key={"L" + i} x={mx} y={my - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0f766e">{lensIn[i] ?? ""}&quot;</text>; })}
        {/* dashed halo on the closable first dot so the dealer sees where to close */}
        {!done && !isClosed && pts.length >= 3 &&
          <circle cx={pts[0].x} cy={pts[0].y} r={snapClose ? 16 : 13} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" opacity={0.9} />}
        {pts.map((p, i) => { const closeable = !done && !isClosed && i === 0 && pts.length >= 3; return <circle key={i} cx={p.x} cy={p.y} r={closeable ? 9 : 7} fill={closeable ? "#10b981" : "#2563eb"} stroke="#ffffff" strokeWidth={2} />; })}
        {!done && !isClosed && pts.length >= 3 && <text x={pts[0].x} y={pts[0].y - 16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#059669">{snapClose ? "release to close" : "tap to close"}</text>}
        {!pts.length && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={16} fill="#cbd5e1">👆 tap the first corner</text>}
      </svg>

      {pts.length >= 2 && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lensIn.map((L, i) => (
            <label key={i} className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 w-12">Wall {i + 1}</span>
              <input type="number" min={1} step={0.25} value={L} onChange={e => setLen(i, parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-slate-300 bg-white text-slate-900 px-1.5 py-1 text-xs" />
              <span className="text-[10px] text-slate-400">in</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <div className="text-sm">
          {result
            ? <span className="text-slate-700">Detected: <b className="text-emerald-700">{result.detected}</b>{isClosed && <span className="text-[11px] text-emerald-600 ml-1">· closed</span>}</span>
            : <span className="text-slate-400">Tap at least two corners.</span>}
          {savedMsg && <span className="text-[11px] text-green-600 font-medium ml-2">{savedMsg}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={undo} disabled={!pts.length} className="text-xs rounded-lg border border-slate-300 text-slate-600 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50">↶ Undo</button>
          {done
            ? <button type="button" onClick={reopen} className="text-xs rounded-lg border border-amber-300 text-amber-700 px-2.5 py-1 hover:bg-amber-50">✎ Reopen</button>
            : <>
                {!isClosed && pts.length >= 3 && <button type="button" onClick={closeLoop} className="text-xs rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-700 px-2.5 py-1 hover:bg-emerald-100">⭗ Close loop</button>}
                <button type="button" onClick={finish} disabled={pts.length < 2} className="text-xs rounded-lg border border-emerald-300 text-emerald-700 px-2.5 py-1 hover:bg-emerald-50 disabled:opacity-50">✓ Done</button>
              </>}
          <button type="button" onClick={save} disabled={pts.length < 2} className="text-xs rounded-lg border border-slate-300 text-slate-600 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50">💾 Save</button>
          <button type="button" onClick={clear} className="text-xs rounded-lg border border-slate-300 text-red-600 px-2.5 py-1 hover:bg-red-50">🗑 Clear</button>
          <button type="button" onClick={add} disabled={!result} className="text-xs rounded-lg bg-emerald-600 text-white px-3 py-1 hover:bg-emerald-700 disabled:opacity-50">➕ Add to this enclosure</button>
        </div>
      </div>
    </div>
  );
}
