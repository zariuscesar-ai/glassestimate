'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ============================ DATA ============================ */
type Sys = { name: string; note: string; psf: number; frame: number; mull: number; glassTint: string; framed: boolean; color: string };
const SYSTEMS: Record<string, Sys> = {
  frameless:  { name: 'Frameless All-Glass', note: '1/2" glass', psf: 85,  frame: 0.06, mull: 0.06, glassTint: '#cfe6ea', framed: false, color: '#3b82f6' },
  framed:     { name: 'Aluminum Framed',      note: '1/4" glass', psf: 55,  frame: 0.16, mull: 0.14, glassTint: '#d3e6ec', framed: true,  color: '#64748b' },
  storefront: { name: 'Storefront',           note: '1" IGU',     psf: 95,  frame: 0.17, mull: 0.17, glassTint: '#cfe1ea', framed: true,  color: '#1e40af' },
  floorceil:  { name: 'Floor-to-Ceiling',     note: 'demountable', psf: 75, frame: 0.22, mull: 0.20, glassTint: '#d6e8ee', framed: true,  color: '#7c3aed' },
  curtain:    { name: 'Curtain Wall',         note: '2.5" system', psf: 120, frame: 0.25, mull: 0.22, glassTint: '#cadfe8', framed: true,  color: '#0891b2' },
};
type Fin = { name: string; face: string; edge: string; dark: string };
const FINISHES: Record<string, Fin> = {
  silver: { name: 'Clear Anodized', face: '#c7ccd2', edge: '#eef1f4', dark: '#8f969e' },
  bronze: { name: 'Dark Bronze',    face: '#5b4f42', edge: '#82755f', dark: '#3a3226' },
  black:  { name: 'Matte Black',    face: '#26292d', edge: '#484c52', dark: '#111316' },
  white:  { name: 'White',          face: '#e9ecef', edge: '#ffffff', dark: '#b9bfc6' },
};
type Door = { name: string; adder: number; leaves: number; kind?: 'swing' | 'slide' | 'pivot' | 'barn' };
const DOORS: Record<string, Door> = {
  none:   { name: 'None', adder: 0, leaves: 0 },
  swing1: { name: 'Single Swing', adder: 2800, leaves: 1, kind: 'swing' },
  swing2: { name: 'Double Swing', adder: 4800, leaves: 2, kind: 'swing' },
  slide1: { name: 'Single Slider', adder: 3200, leaves: 1, kind: 'slide' },
  slide2: { name: 'Center Slider', adder: 4600, leaves: 2, kind: 'slide' },
  pivot:  { name: 'Pivot', adder: 5200, leaves: 1, kind: 'pivot' },
  barn:   { name: 'Barn', adder: 3000, leaves: 1, kind: 'barn' },
};

interface Client { id: number; name: string; }
type Pt = { x: number; y: number };
interface Run { system: string; finish: string; door: string; leafFt: number; doorPos: 'left' | 'center' | 'right'; transom: boolean; transomFt: number; sidelites: boolean; panels: number; }
const newRun = (system = 'storefront', door = 'none'): Run => ({ system, finish: 'silver', door, leafFt: 3, doorPos: 'center', transom: false, transomFt: 1.5, sidelites: true, panels: 1 });

function preset(kind: string): { pts: Pt[]; runs: Run[] } {
  if (kind === 'flat') return { pts: [{ x: 0, y: 0 }, { x: 24, y: 0 }], runs: [newRun('storefront', 'swing2')] };
  if (kind === 'L') return { pts: [{ x: 0, y: 0 }, { x: 14, y: 0 }, { x: 14, y: -10 }], runs: [newRun('frameless', 'swing1'), newRun('frameless', 'none')] };
  return { pts: [{ x: 0, y: -10 }, { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: -10 }], runs: [newRun('framed', 'none'), newRun('storefront', 'swing2'), newRun('framed', 'none')] };
}

/* ============================ DRAW HELPERS ============================ */
function hexA(hex: string, a: number) { const c = hex.replace('#', ''); const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16); return `rgba(${r},${g},${b},${a})`; }
function shade(hex: string, p: number) { const c = hex.replace('#', ''); let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16); r = Math.max(0, Math.min(255, r + p)); g = Math.max(0, Math.min(255, g + p)); b = Math.max(0, Math.min(255, b + p)); return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
function fmtFt(n: number) { const f = Math.floor(n); const inch = Math.round((n - f) * 12); return inch ? `${f}'-${inch}"` : `${f}'-0"`; }

// Glass pieces (cut list) for one wall run — mirrors the bay layout the render
// uses, returned in feet. Each entry is a distinct panel/leaf with qty + size,
// ready for a production/cut sheet.
type GlassPiece = { label: string; w: number; h: number; qty: number };
function wallGlass(run: Run, wFt: number, hFt: number): GlassPiece[] {
  const door = DOORS[run.door]; const hasDoor = door.leaves > 0;
  const bodyH = run.transom ? Math.max(0.1, hFt - run.transomFt) : hFt;
  const out: GlassPiece[] = [];
  const doorW = hasDoor ? run.leafFt * door.leaves : 0;
  const remain = Math.max(0, wFt - doorW);
  if (!hasDoor) {
    const n = Math.max(1, run.panels * (run.sidelites ? 2 : 1));
    out.push({ label: 'Fixed panel', w: wFt / n, h: bodyH, qty: n });
  } else {
    let leftW = 0, rightW = 0;
    if (run.doorPos === 'center') { leftW = remain / 2; rightW = remain / 2; }
    else if (run.doorPos === 'left') { rightW = remain; } else { leftW = remain; }
    if (leftW > 0.1) { const n = Math.max(1, run.panels); out.push({ label: 'Fixed panel (left)', w: leftW / n, h: bodyH, qty: n }); }
    out.push({ label: `${door.name} leaf`, w: run.leafFt, h: bodyH, qty: door.leaves });
    if (rightW > 0.1) { const n = Math.max(1, run.panels); out.push({ label: 'Fixed panel (right)', w: rightW / n, h: bodyH, qty: n }); }
  }
  if (run.transom && run.transomFt > 0.05) out.push({ label: 'Transom', w: wFt, h: run.transomFt, qty: 1 });
  return out;
}

function drawAssembly(ctx: CanvasRenderingContext2D, ox: number, oy: number, W: number, H: number, transparentGlass: boolean, run: Run, wFt: number, hFt: number) {
  const sys = SYSTEMS[run.system], fin = FINISHES[run.finish];
  const ftToPx = W / wFt;
  const frameT = Math.max(3, sys.frame * ftToPx), mullT = Math.max(3, sys.mull * ftToPx);
  const glassCol = sys.glassTint;
  let bodyY = oy, bodyH = H, transomH = 0;
  if (run.transom) { transomH = Math.min(H * 0.4, run.transomFt * ftToPx); bodyY = oy + transomH; bodyH = H - transomH; }
  const door = DOORS[run.door], hasDoor = door.leaves > 0;
  const doorW = hasDoor ? run.leafFt * ftToPx * door.leaves : 0;
  type Bay = { x: number; w: number; type: 'fixed' | 'door'; panels?: number };
  const bays: Bay[] = [];
  if (!hasDoor) bays.push({ x: ox, w: W, type: 'fixed', panels: run.panels * (run.sidelites ? 2 : 1) });
  else {
    let leftW = 0, rightW = 0, dx = ox; const remain = Math.max(0, W - doorW);
    if (run.doorPos === 'center') { leftW = remain / 2; rightW = remain / 2; } else if (run.doorPos === 'left') { rightW = remain; } else { leftW = remain; }
    if (leftW > 2) { bays.push({ x: dx, w: leftW, type: 'fixed', panels: run.panels }); dx += leftW; }
    bays.push({ x: dx, w: doorW, type: 'door' }); dx += doorW;
    if (rightW > 2) bays.push({ x: dx, w: rightW, type: 'fixed', panels: run.panels });
  }
  function glassFill(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    // stronger tint on photo so the glass reads as real glass (was washing out)
    const a1 = transparentGlass ? 0.55 : 0.85, a2 = transparentGlass ? 0.74 : 0.95;
    g.addColorStop(0, hexA(glassCol, a2)); g.addColorStop(0.42, hexA('#f4fcff', transparentGlass ? 0.5 : 0.7));
    g.addColorStop(0.58, hexA(glassCol, a1)); g.addColorStop(1, hexA(shade(glassCol, -30), transparentGlass ? 0.8 : 0.9));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    // bright specular streaks (crisper on photo)
    ctx.globalAlpha = transparentGlass ? 0.4 : 0.24; ctx.fillStyle = '#ffffff'; const sw = w * 0.5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.05, y + h); ctx.lineTo(x + w * 0.05 + sw * 0.4, y); ctx.lineTo(x + w * 0.16 + sw * 0.4, y); ctx.lineTo(x + w * 0.16, y + h); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = transparentGlass ? 0.22 : 0.14;
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h); ctx.lineTo(x + w * 0.5 + sw * 0.3, y); ctx.lineTo(x + w * 0.57 + sw * 0.3, y); ctx.lineTo(x + w * 0.57, y + h); ctx.closePath(); ctx.fill();
    // inner edge shadow for depth (glass set into frame)
    ctx.globalAlpha = 1; const es = Math.max(3, Math.min(w, h) * 0.03);
    const eg = ctx.createLinearGradient(x, y, x, y + es); eg.addColorStop(0, hexA('#0b1a2e', transparentGlass ? 0.35 : 0.28)); eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg; ctx.fillRect(x, y, w, es);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function bar(x: number, y: number, w: number, h: number, vertical: boolean) {
    if (w <= 0 || h <= 0) return;
    const g = vertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, fin.dark); g.addColorStop(0.5, fin.face); g.addColorStop(0.5, fin.edge); g.addColorStop(1, fin.dark);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hexA('#ffffff', 0.25); if (vertical) ctx.fillRect(x, y, Math.max(1, w * 0.18), h); else ctx.fillRect(x, y, w, Math.max(1, h * 0.18));
  }
  function drawFixed(b: Bay, y: number, h: number) { glassFill(b.x, y, b.w, h); const n = Math.max(1, b.panels || 1); for (let i = 1; i < n; i++) { const mx = b.x + b.w * i / n - mullT / 2; bar(mx, y, mullT, h, true); } }
  function drawDoor(x: number, y: number, w: number, h: number) {
    const kind = door.kind, leaves = door.leaves, lw = w / leaves;
    if (kind === 'barn') bar(x - 6, y - mullT * 1.4, w + 12, mullT * 1.4, false);
    for (let i = 0; i < leaves; i++) {
      const lx = x + i * lw; glassFill(lx + 2, y, lw - 4, h);
      if (sys.framed || kind === 'swing' || kind === 'pivot') {
        const st = Math.max(4, frameT * 0.9), rail = Math.max(6, frameT * 1.4), brail = Math.max(10, frameT * 2.4);
        bar(lx + 2, y, st, h, true); bar(lx + lw - 2 - st, y, st, h, true);
        bar(lx + 2, y, lw - 4, rail, false); bar(lx + 2, y + h - brail, lw - 4, brail, false);
      }
      if (kind === 'swing' || kind === 'pivot') {
        const pullX = (leaves === 2) ? (i === 0 ? lx + lw - 14 : lx + 8) : lx + lw - 16;
        ctx.fillStyle = fin.face; roundRect(ctx, pullX, y + h * 0.4, 6, h * 0.22, 3); ctx.fill();
        ctx.fillStyle = fin.edge; ctx.fillRect(pullX + 1, y + h * 0.4, 2, h * 0.22);
        if (kind === 'pivot') { ctx.fillStyle = fin.dark; ctx.beginPath(); ctx.arc(lx + lw * 0.16, y + h - 6, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(lx + lw * 0.16, y + 8, 5, 0, 7); ctx.fill(); }
      }
      if (kind === 'slide') {
        const px = (leaves === 2) ? (i === 0 ? lx + lw - 16 : lx + 10) : lx + lw * 0.5 - 3;
        ctx.fillStyle = fin.face; roundRect(ctx, px, y + h * 0.42, 6, h * 0.18, 3); ctx.fill();
        ctx.strokeStyle = hexA('#0e2038', 0.55); ctx.lineWidth = 2; const ay = y + h * 0.5, dir = (leaves === 2) ? (i === 0 ? -1 : 1) : 1;
        ctx.beginPath(); ctx.moveTo(lx + lw * 0.5 - 12 * dir, ay); ctx.lineTo(lx + lw * 0.5 + 12 * dir, ay); ctx.moveTo(lx + lw * 0.5 + 12 * dir, ay); ctx.lineTo(lx + lw * 0.5 + 4 * dir, ay - 5); ctx.moveTo(lx + lw * 0.5 + 12 * dir, ay); ctx.lineTo(lx + lw * 0.5 + 4 * dir, ay + 5); ctx.stroke();
      }
      if (kind === 'barn') { ctx.fillStyle = fin.dark; ctx.fillRect(lx + lw * 0.2 - 4, y - mullT * 1.2, 8, mullT * 1.2); ctx.fillRect(lx + lw * 0.8 - 4, y - mullT * 1.2, 8, mullT * 1.2); ctx.fillStyle = fin.face; ctx.fillRect(lx + lw * 0.5 - 3, y + h * 0.42, 6, h * 0.16); }
    }
    if (kind === 'swing' && leaves === 2) { ctx.fillStyle = fin.dark; ctx.fillRect(x + w / 2 - 2, y, 4, h); }
  }
  if (run.transom && transomH > 4) {
    for (const b of bays) { glassFill(b.x, oy, b.w, transomH); if (b.type === 'fixed') { const n = Math.max(1, b.panels || 1); for (let i = 1; i < n; i++) { const mx = b.x + b.w * i / n - mullT / 2; bar(mx, oy, mullT, transomH, true); } } }
    if (sys.framed) bar(ox, oy + transomH - mullT / 2, W, mullT, false);
  }
  for (const b of bays) { if (b.type === 'fixed') drawFixed(b, bodyY, bodyH); else drawDoor(b.x, bodyY, b.w, bodyH); }
  if (sys.framed) {
    bar(ox, oy, W, frameT, false); bar(ox, oy + H - frameT, W, frameT, false); bar(ox, oy, frameT, H, true); bar(ox + W - frameT, oy, frameT, H, true);
    for (let i = 1; i < bays.length; i++) { const mx = bays[i].x - mullT / 2; bar(mx, oy, mullT, H, true); }
  } else {
    bar(ox, oy, W, Math.max(4, frameT), false); bar(ox, oy + H - Math.max(4, frameT), W, Math.max(4, frameT), false);
    for (let i = 1; i < bays.length; i++) { if (bays[i].type !== 'door' && bays[i - 1].type !== 'door') { const jx = bays[i].x - 1; ctx.fillStyle = hexA('#5b6b82', 0.5); ctx.fillRect(jx, oy, 2, H); } }
  }
  ctx.fillStyle = '#cdd9ee'; ctx.font = `600 ${Math.max(11, W * 0.014)}px -apple-system,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText(fmtFt(wFt), ox + W / 2, oy + H + Math.max(20, H * 0.05));
  ctx.save(); ctx.translate(ox - Math.max(14, W * 0.02), oy + H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(fmtFt(hFt), 0, 0); ctx.restore();
  ctx.textAlign = 'start';
}

// Multi-wall elevation sheet: draw EVERY wall's elevation together on one shared
// scale, so a job with several glass walls — standalone or a connected run —
// reads like a proper shop elevation page (Wall 1, Wall 2, …). Tiles flow across
// rows, auto-scaled to fit; the selected wall is ringed. widthsFt[i] is the
// finished width of wall i in feet.
function drawElevationSheet(ctx: CanvasRenderingContext2D, cw: number, ch: number, widthsFt: number[], runs: Run[], hFt: number, sel: number, title: string, openingLabels: string[] = []) {
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, '#1a2740'); g.addColorStop(0.7, '#131f34'); g.addColorStop(0.7, '#0e1828'); g.addColorStop(1, '#0a1220');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);

  const margin = 28, gap = 26, labelH = 22, dimH = 26, titleH = 34;
  const availW = cw - margin * 2;
  const availTop = titleH + 4, availH = ch - availTop - margin;
  const asps = widthsFt.map(w => Math.max(0.2, (w || 1) / hFt));   // width/height per wall
  const maxAsp = Math.max(0.2, ...asps);

  // Pack tiles of uniform height Hpx into rows that fit availW.
  const packRows = (Hpx: number) => {
    const tileW = asps.map(a => Hpx * a);
    const rows: number[][] = []; let cur: number[] = []; let acc = 0;
    for (let i = 0; i < tileW.length; i++) {
      const w = tileW[i];
      if (cur.length && acc + gap + w > availW) { rows.push(cur); cur = []; acc = 0; }
      cur.push(i); acc += (cur.length > 1 ? gap : 0) + w;
    }
    if (cur.length) rows.push(cur);
    return rows;
  };
  // Largest tile height whose packed rows still fit vertically and per-tile width fits.
  let lo = 24, hi = availH, Hpx = lo;
  for (let it = 0; it < 26; it++) {
    const mid = (lo + hi) / 2;
    const rows = packRows(mid);
    const totalH = rows.length * (mid + labelH + dimH) + (rows.length - 1) * gap;
    if (totalH <= availH && mid * maxAsp <= availW) { Hpx = mid; lo = mid; } else hi = mid;
  }
  const rows = packRows(Hpx);
  const blockH = Hpx + labelH + dimH;
  const totalH = rows.length * blockH + (rows.length - 1) * gap;
  let y = availTop + Math.max(0, (availH - totalH) / 2);

  ctx.fillStyle = '#e6edf8'; ctx.font = '600 15px -apple-system,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`${title || 'Elevations'} — ${runs.length} wall${runs.length > 1 ? 's' : ''} · ${fmtFt(hFt)} ceiling`, margin, 22);

  for (const row of rows) {
    const rowW = row.reduce((s, i) => s + Hpx * asps[i], 0) + gap * (row.length - 1);
    let x = (cw - rowW) / 2;
    const top = y + labelH;
    for (const i of row) {
      const wpx = Hpx * asps[i]; const run = runs[i]; const wFt = widthsFt[i]; const sys = SYSTEMS[run.system];
      // colour chip + label
      ctx.fillStyle = sys.color; ctx.fillRect(x, y + 3, 12, 6);
      ctx.fillStyle = i === sel ? '#dbe7ff' : '#9fb0cc'; ctx.font = '600 12px -apple-system,sans-serif'; ctx.textAlign = 'left';
      const olab = openingLabels[i] ? `  ·  ${openingLabels[i]}` : '';
      ctx.fillText(`Wall ${i + 1} · ${sys.name}${olab}`, x + 18, y + 13);
      // floor shadow + the elevation itself
      ctx.save(); ctx.filter = 'blur(6px)'; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 6, top + Hpx - 4, wpx, 12); ctx.restore();
      drawAssembly(ctx, x, top, wpx, Hpx, false, run, wFt, hFt);
      if (i === sel) { ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; roundRect(ctx, x - 5, top - 5, wpx + 10, Hpx + 10, 8); ctx.stroke(); }
      // width dimension under the tile
      const dy = top + Hpx + 14;
      ctx.strokeStyle = '#5b6b86'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x + wpx, dy); ctx.moveTo(x, dy - 4); ctx.lineTo(x, dy + 4); ctx.moveTo(x + wpx, dy - 4); ctx.lineTo(x + wpx, dy + 4); ctx.stroke();
      ctx.fillStyle = '#c3cee1'; ctx.font = '600 11px -apple-system,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(fmtFt(wFt), x + wpx / 2, dy + 15);
      x += wpx + gap;
    }
    y += blockH + gap;
  }
  ctx.textAlign = 'left';
}

function planTransform(pts: Pt[], cw: number, ch: number) {
  const pad = 70; const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const wft = Math.max(1, maxx - minx), hft = Math.max(1, maxy - miny);
  const scale = Math.min((cw - pad * 2) / wft, (ch - pad * 2) / hft, 26);
  const ox = (cw - wft * scale) / 2 - minx * scale; const oy = (ch - hft * scale) / 2 + maxy * scale;
  return { scale, toPx: (p: Pt) => ({ x: ox + p.x * scale, y: oy - p.y * scale }), toFt: (x: number, y: number) => ({ x: (x - ox) / scale, y: (oy - y) / scale }) };
}

// A stable, non-fitting transform used WHILE hand-drawing so the picture never
// rescales/recenters as points are added — taps land exactly where clicked and
// placed corners stay put. Auto-fit (planTransform) is used only for presets and
// finished shapes. Both the click handler and the renderer use getPlanT() so
// screen<->feet mapping is identical in both.
type PlanT = { scale: number; toPx: (p: Pt) => Pt; toFt: (x: number, y: number) => Pt };
const DRAW_SCALE = 22; // px per foot while drawing
function fixedTransform(cw: number, ch: number): PlanT {
  const ox = cw / 2, oy = ch * 0.6, scale = DRAW_SCALE;
  return { scale, toPx: (p: Pt) => ({ x: ox + p.x * scale, y: oy - p.y * scale }), toFt: (x: number, y: number) => ({ x: (x - ox) / scale, y: (oy - y) / scale }) };
}
function getPlanT(pts: Pt[], cw: number, ch: number, draw: boolean): PlanT {
  return draw ? fixedTransform(cw, ch) : planTransform(pts, cw, ch);
}

function drawPlan(ctx: CanvasRenderingContext2D, cw: number, ch: number, pts: Pt[], runs: Run[], sel: number, title: string, t: PlanT, draw: boolean, preview: Pt | null = null) {
  ctx.fillStyle = '#0e1828'; ctx.fillRect(0, 0, cw, ch);
  if (draw) {
    // Graph-paper grid locked to the drawing scale: 1 square = 1 ft, brighter every 5 ft.
    const o = t.toPx({ x: 0, y: 0 }); const s = t.scale;
    for (let gx = ((o.x % s) + s) % s, n = Math.round((gx - o.x) / s); gx < cw; gx += s, n++) { ctx.strokeStyle = n % 5 === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
    for (let gy = ((o.y % s) + s) % s, n = Math.round((o.y - gy) / s); gy < ch; gy += s, n++) { ctx.strokeStyle = n % 5 === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i < cw; i += 28) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, ch); ctx.stroke(); }
    for (let i = 0; i < ch; i += 28) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(cw, i); ctx.stroke(); }
  }
  ctx.fillStyle = '#cdd9ee'; ctx.font = '600 15px -apple-system,sans-serif'; ctx.textAlign = 'start'; ctx.fillText(title || 'Floor Plan', 18, 28);
  ctx.fillStyle = '#7f90ad'; ctx.font = '11px -apple-system,sans-serif'; ctx.fillText(draw ? 'Draw mode — 1 square = 1 ft' : 'Top-down view', 18, 46);
  if (pts.length < 2) {
    if (draw) {
      ctx.fillStyle = '#93a4c2'; ctx.font = '13px -apple-system,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(pts.length === 0 ? 'Tap the first corner to start…' : 'Tap the next corner…', cw / 2, ch - 26); ctx.textAlign = 'start';
      if (pts.length === 1) { const q = t.toPx(pts[0]); ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, 7); ctx.fill(); ctx.stroke(); }
      return;
    }
    ctx.fillStyle = '#64748b'; ctx.font = '13px -apple-system,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Pick a layout or “Draw it” to begin…', cw / 2, ch / 2); ctx.textAlign = 'start';
    return;
  }
  // enclosure interior (centroid of corners, in px) — swings & labels orient off this
  const cxs = pts.map(p => t.toPx(p)); const cen = { x: cxs.reduce((s, p) => s + p.x, 0) / cxs.length, y: cxs.reduce((s, p) => s + p.y, 0) / cxs.length };
  const drawArc = (h: Pt, r: number, s: number, e: number) => { const d = Math.atan2(Math.sin(e - s), Math.cos(e - s)); ctx.beginPath(); for (let k = 0; k <= 14; k++) { const ang = s + d * k / 14; const px = h.x + Math.cos(ang) * r, py = h.y + Math.sin(ang) * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); };
  for (let i = 0; i < pts.length - 1; i++) {
    const run = runs[i] || newRun(); const a = t.toPx(pts[i]), b = t.toPx(pts[i + 1]);
    const sys = SYSTEMS[run.system]; const door = DOORS[run.door];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1; const ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux; // flip normal to point INTO the enclosure interior
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; if ((cen.x - mid.x) * nx + (cen.y - mid.y) * ny < 0) { nx = -nx; ny = -ny; }
    const wallW = sel === i ? 13 : 10;
    const runFt = dist(pts[i], pts[i + 1]); const doorFt = door.leaves > 0 ? run.leafFt * door.leaves : 0;
    let gapC = 0.5; if (run.doorPos === 'left') gapC = Math.min(0.5, doorFt / runFt / 2 + 0.04); if (run.doorPos === 'right') gapC = Math.max(0.5, 1 - doorFt / runFt / 2 - 0.04);
    const gapHalf = door.leaves > 0 ? (doorFt / runFt) / 2 : 0;
    ctx.strokeStyle = sys.color; ctx.lineCap = 'butt'; ctx.lineWidth = wallW;
    if (door.leaves > 0 && gapHalf > 0.01 && gapHalf < 0.48) {
      const g0 = gapC - gapHalf, g1 = gapC + gapHalf;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + dx * g0, a.y + dy * g0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x + dx * g1, a.y + dy * g1); ctx.lineTo(b.x, b.y); ctx.stroke();
      const leafPx = (2 * gapHalf) * len / door.leaves; const nAng = Math.atan2(ny, nx);
      ctx.strokeStyle = hexA(sys.color, 0.85); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
      if (door.kind === 'swing' || door.kind === 'pivot') {
        // hinge each leaf at its jamb; leaves swing into the room to meet at center
        const jambs = door.leaves === 2 ? [{ f: g0, close: Math.atan2(uy, ux) }, { f: g1, close: Math.atan2(-uy, -ux) }] : [{ f: g0, close: Math.atan2(uy, ux) }];
        for (const j of jambs) { const h = { x: a.x + dx * j.f, y: a.y + dy * j.f }; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + nx * leafPx, h.y + ny * leafPx); ctx.stroke(); drawArc(h, leafPx, j.close, nAng); }
      } else { ctx.beginPath(); ctx.moveTo(a.x + dx * g0 + nx * 3.5, a.y + dy * g0 + ny * 3.5); ctx.lineTo(a.x + dx * g1 + nx * 3.5, a.y + dy * g1 + ny * 3.5); ctx.stroke(); }
      ctx.setLineDash([]);
    } else { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    const mx = (a.x + b.x) / 2 - nx * 22, my = (a.y + b.y) / 2 - ny * 22; // label on the outside
    ctx.fillStyle = '#e8eefb'; ctx.font = '600 12px -apple-system,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(fmtFt(runFt), mx, my); ctx.textAlign = 'start';
    if (sel === i) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(a.x - nx * 10, a.y - ny * 10); ctx.lineTo(b.x - nx * 10, b.y - ny * 10); ctx.stroke(); ctx.setLineDash([]); }
  }
  // Live preview of the segment being drawn: dashed line from the last corner to
  // the cursor, with its live length — so each new line's measurement is visible.
  if (draw && preview && pts.length >= 1) {
    const a = t.toPx(pts[pts.length - 1]), b = t.toPx(preview);
    ctx.strokeStyle = 'rgba(37,99,235,0.75)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    const L = dist(pts[pts.length - 1], preview);
    ctx.fillStyle = '#93c5fd'; ctx.font = '600 12px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(fmtFt(L), (a.x + b.x) / 2, (a.y + b.y) / 2 - 8); ctx.textAlign = 'start';
  }
  // Corners. In draw/edit mode they are larger grab targets; the first corner turns
  // green once there are 3+ points to signal "tap here to close the shape".
  pts.forEach((p, i) => {
    const q = t.toPx(p); const canClose = draw && i === 0 && pts.length >= 3;
    ctx.fillStyle = draw ? (canClose ? '#10b981' : '#2563eb') : '#0e1828';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(q.x, q.y, draw ? 7 : 5, 0, 7); ctx.fill(); ctx.stroke();
  });
  const used = Array.from(new Set(runs.map(r => r.system)));
  const ly = ch - 14 - used.length * 16;
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(14, ly - 16, 152, used.length * 16 + 22);
  ctx.fillStyle = '#93a4c2'; ctx.font = '600 10px -apple-system,sans-serif'; ctx.fillText('SYSTEMS', 22, ly - 2);
  used.forEach((s, i) => { ctx.fillStyle = SYSTEMS[s].color; ctx.fillRect(22, ly + i * 16 + 4, 14, 5); ctx.fillStyle = '#cdd9ee'; ctx.font = '10px -apple-system,sans-serif'; ctx.fillText(SYSTEMS[s].name, 42, ly + i * 16 + 10); });
}

function solve(A: number[][], b: number[]) { const n = b.length; for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;[A[i], A[p]] = [A[p], A[i]];[b[i], b[p]] = [b[p], b[i]]; const d = A[i][i] || 1e-9; for (let r = 0; r < n; r++) { if (r === i) continue; const f = A[r][i] / d; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } } return b.map((v, i) => v / (A[i][i] || 1e-9)); }
function homography(dst: Pt[]) { const pts = [[0, 0], [1, 0], [1, 1], [0, 1]]; const A: number[][] = [], b: number[] = []; for (let i = 0; i < 4; i++) { const [u, v] = pts[i], { x, y } = dst[i]; A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x); A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y); } return solve(A, b); }
function project(h: number[], u: number, v: number) { const den = h[6] * u + h[7] * v + 1; return { x: (h[0] * u + h[1] * v + h[2]) / den, y: (h[3] * u + h[4] * v + h[5]) / den }; }
function tri(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, s0: Pt, s1: Pt, s2: Pt, d0: Pt, d1: Pt, d2: Pt) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(d0.x, d0.y); ctx.lineTo(d1.x, d1.y); ctx.lineTo(d2.x, d2.y); ctx.closePath(); ctx.clip();
  const denom = s0.x * (s2.y - s1.y) + s1.x * (s0.y - s2.y) + s2.x * (s1.y - s0.y); if (Math.abs(denom) < 1e-6) { ctx.restore(); return; }
  const m11 = -(s0.y * (d2.x - d1.x) - s1.y * d2.x + s2.y * d1.x + (s1.y - s2.y) * d0.x) / denom;
  const m12 = (s1.y * d2.y + s0.y * (d1.y - d2.y) - s2.y * d1.y + (s2.y - s1.y) * d0.y) / denom;
  const m21 = (s0.x * (d2.x - d1.x) - s1.x * d2.x + s2.x * d1.x + (s1.x - s2.x) * d0.x) / denom;
  const m22 = -(s1.x * d2.y + s0.x * (d1.y - d2.y) - s2.x * d1.y + (s2.x - s1.x) * d0.y) / denom;
  const dx = (s0.x * (s2.y * d1.x - s1.y * d2.x) + s0.y * (s1.x * d2.x - s2.x * d1.x) + (s2.x * s1.y - s1.x * s2.y) * d0.x) / denom;
  const dy = (s0.x * (s2.y * d1.y - s1.y * d2.y) + s0.y * (s1.x * d2.y - s2.x * d1.y) + (s2.x * s1.y - s1.x * s2.y) * d0.y) / denom;
  ctx.transform(m11, m12, m21, m22, dx, dy); ctx.drawImage(img, 0, 0); ctx.restore();
}
function warp(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, corners: Pt[]) { const h = homography(corners); const N = 28, sw = src.width, sh = src.height; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N; const s = [{ x: u0 * sw, y: v0 * sh }, { x: u1 * sw, y: v0 * sh }, { x: u1 * sw, y: v1 * sh }, { x: u0 * sw, y: v1 * sh }]; const d = [project(h, u0, v0), project(h, u1, v0), project(h, u1, v1), project(h, u0, v1)]; tri(ctx, src, s[0], s[1], s[2], d[0], d[1], d[2]); tri(ctx, src, s[0], s[2], s[3], d[0], d[2], d[3]); } }
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) { const ir = img.width / img.height, cr = cw / ch; let dw, dh, dx, dy; if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; } else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; } ctx.drawImage(img, dx, dy, dw, dh); }

/* ============================ PAGE ============================ */
const money = (n: number) => '$' + Math.round(n).toLocaleString();

export default function VisualEstimatorPage() {
  const router = useRouter();
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [heightFt, setHeightFt] = useState(9);
  const [pts, setPts] = useState<Pt[]>(preset('flat').pts);
  const [runs, setRuns] = useState<Run[]>(preset('flat').runs);
  const [sel, setSel] = useState(0);
  const [view, setView] = useState<'plan' | 'elev' | 'photo'>('plan');
  const [elevSheet, setElevSheet] = useState(true);   // elevation view: all-walls sheet vs. single selected wall
  const [drawMode, setDrawMode] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [corners, setCorners] = useState<Pt[] | null>(null);
  const [placing, setPlacing] = useState(false);
  const [tmp, setTmp] = useState<Pt[]>([]);
  const [psfMap, setPsfMap] = useState<Record<string, number>>(Object.fromEntries(Object.entries(SYSTEMS).map(([k, v]) => [k, v.psf])));
  const [laborPsf, setLaborPsf] = useState(14);
  const [taxPct, setTaxPct] = useState(8.25);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hoverFt, setHoverFt] = useState<Pt | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { fetch('/api/clients').then(r => r.json()).then(d => { if (Array.isArray(d)) setClients(d); }).catch(() => {}); }, []);

  // Restore the last saved shape (kept on this device) so work isn't lost on reload.
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('glassestimate:ve:v1') : null;
      if (!raw) return; const d = JSON.parse(raw);
      if (Array.isArray(d.pts) && d.pts.length >= 2) {
        setPts(d.pts); if (Array.isArray(d.runs) && d.runs.length) setRuns(d.runs);
        if (typeof d.heightFt === 'number') setHeightFt(d.heightFt);
        if (typeof d.projectName === 'string') setProjectName(d.projectName);
      }
    } catch { /* ignore */ }
  }, []);

  const run = runs[sel] || newRun();
  const setRun = (patch: Partial<Run>) => setRuns(rs => rs.map((r, i) => i === sel ? { ...r, ...patch } : r));
  const applyPreset = (k: string) => { const p = preset(k); setPts(p.pts); setRuns(p.runs); setSel(0); setDrawMode(false); setView('plan'); };
  const runLen = (i: number) => (pts[i] && pts[i + 1]) ? dist(pts[i], pts[i + 1]) : 0;
  const setRunLen = (i: number, L: number) => { setPts(ps => { const a = ps[i], b = ps[i + 1]; if (!a || !b) return ps; const d = dist(a, b) || 1; const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d; const delta = L - d; return ps.map((p, j) => j > i ? { x: p.x + ux * delta, y: p.y + uy * delta } : p); }); };

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (view === 'photo' && photo) {
      drawCover(ctx, photo, cv.width, cv.height);
      if (placing) {
        ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        tmp.forEach((p, i) => { ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(String(i + 1), p.x - 3, p.y + 4); ctx.fillStyle = '#2563eb'; });
        if (tmp.length > 1) { ctx.strokeStyle = '#2563eb'; ctx.beginPath(); ctx.moveTo(tmp[0].x, tmp[0].y); tmp.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
        return;
      }
      if (corners && corners.length === 4) {
        const wFt = runLen(sel) || 12; const asp = wFt / heightFt; const ew = 1000, eh = Math.max(1, Math.round(ew / asp));
        // installed drop-shadow: cast the opening's footprint onto the wall so it sits in the scene
        ctx.save(); ctx.filter = 'blur(7px)'; ctx.fillStyle = 'rgba(6,12,22,0.28)';
        ctx.beginPath(); corners.forEach((c, i) => { const p = { x: c.x + 6, y: c.y + 9 }; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.fill(); ctx.restore();
        const off = document.createElement('canvas'); off.width = ew; off.height = eh; const octx = off.getContext('2d')!;
        drawAssembly(octx, ew * 0.02, eh * 0.02, ew * 0.96, eh * 0.96, true, run, wFt, heightFt);
        warp(ctx, off, corners);
      }
      return;
    }
    if (view === 'plan') { drawPlan(ctx, cv.width, cv.height, pts, runs, sel, projectName, getPlanT(pts, cv.width, cv.height, drawMode), drawMode, drawMode && dragIdx == null ? hoverFt : null); return; }
    // ELEVATION VIEW — a multi-wall elevation sheet when the job has several walls.
    if (elevSheet && runs.length > 1) { drawElevationSheet(ctx, cv.width, cv.height, runs.map((_, i) => runLen(i)), runs, heightFt, sel, projectName, wallOpenings); return; }
    const g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#1a2740'); g.addColorStop(0.7, '#131f34'); g.addColorStop(0.7, '#0e1828'); g.addColorStop(1, '#0a1220');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(0, cv.height * 0.72, cv.width, 2);
    const wFt = runLen(sel) || 12; const asp = wFt / heightFt; let W = cv.width * 0.72, H = W / asp; const maxH = cv.height * 0.6;
    if (H > maxH) { H = maxH; W = H * asp; }
    const ox = (cv.width - W) / 2, oy = cv.height * 0.72 - H;
    ctx.save(); ctx.filter = 'blur(8px)'; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(ox + 8, oy + H - 4, W, 14); ctx.restore();
    drawAssembly(ctx, ox, oy, W, H, false, run, wFt, heightFt);
    ctx.fillStyle = '#7f90ad'; ctx.font = '12px -apple-system,sans-serif'; ctx.fillText(`Wall ${sel + 1} of ${runs.length} — ${SYSTEMS[run.system].name}`, 18, 26);
  }, [pts, runs, sel, view, elevSheet, photo, corners, placing, tmp, heightFt, projectName, drawMode, hoverFt, dragIdx]);

  // Keep one wall (run) per drawn segment: N corners => N-1 walls. Runs carry
  // per-wall config, so we only add/trim to match the segment count.
  useEffect(() => {
    const need = Math.max(0, pts.length - 1);
    setRuns(rs => rs.length === need ? rs : rs.length < need ? [...rs, ...Array(need - rs.length).fill(0).map(() => newRun())] : rs.slice(0, need));
  }, [pts.length]);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { setPhoto(img); setCorners(null); setView('photo'); setPlacing(true); setTmp([]); }; img.src = r.result as string; }; r.readAsDataURL(f); };
  const localXY = (e: React.PointerEvent<HTMLCanvasElement>) => { const cv = cvRef.current!; const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
  const snapFt = (t: PlanT, x: number, y: number): Pt => { const f = t.toFt(x, y); return { x: Math.round(f.x * 2) / 2, y: Math.round(f.y * 2) / 2 }; };
  const hitPoint = (x: number, y: number, t: PlanT) => { for (let i = 0; i < pts.length; i++) { const q = t.toPx(pts[i]); if (Math.hypot(q.x - x, q.y - y) <= 13) return i; } return -1; };

  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = cvRef.current!; const { x, y } = localXY(e);
    if (view === 'photo' && placing) { const next = [...tmp, { x, y }]; setTmp(next); if (next.length === 4) { setCorners(next); setPlacing(false); } return; }
    if (view === 'plan' && drawMode) {
      const t = fixedTransform(cv.width, cv.height);
      // Grab an existing corner to move it (fixes "points disappear when I adjust").
      const hit = hitPoint(x, y, t);
      if (hit >= 0) { setDragIdx(hit); return; }
      // Tap on/near the first corner (3+ pts) closes the shape into a loop.
      if (pts.length >= 3) { const q0 = t.toPx(pts[0]); if (Math.hypot(q0.x - x, q0.y - y) <= 14) { setPts(ps => [...ps, { ...ps[0] }]); setDrawMode(false); return; } }
      setPts(ps => [...ps, snapFt(t, x, y)]); // walls auto-sync to segment count via effect
    }
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (view !== 'plan' || !drawMode) return;
    const cv = cvRef.current!; const { x, y } = localXY(e); const t = fixedTransform(cv.width, cv.height); const sp = snapFt(t, x, y);
    if (dragIdx != null) setPts(ps => ps.map((p, i) => (i === dragIdx ? sp : p)));
    else setHoverFt(sp);
  };
  const onCanvasUp = () => { if (dragIdx != null) setDragIdx(null); };
  const onCanvasLeave = () => { setDragIdx(null); setHoverFt(null); };

  // Enter draw/edit mode WITHOUT wiping the current shape (so corners can be
  // adjusted). Only starts empty when there is nothing drawn yet.
  const editShape = () => { setView('plan'); setDrawMode(true); };
  // Sketch flow: pick a glass system that applies to every wall you've drawn.
  const applySystemAll = (system: string) => setRuns(rs => (rs.length ? rs.map(r => ({ ...r, system })) : [newRun(system)]));
  // One-click: finish the sketch and jump straight to the realistic elevation render.
  const convertToRender = () => { setDrawMode(false); setSel(0); setView('elev'); };
  const undoPoint = () => setPts(ps => ps.slice(0, -1));
  const deleteShape = () => { setPts([]); setRuns([]); setSel(0); setDrawMode(true); setView('plan'); setHoverFt(null); try { window.localStorage.removeItem('glassestimate:ve:v1'); } catch { /* ignore */ } };
  const saveShape = () => {
    try { window.localStorage.setItem('glassestimate:ve:v1', JSON.stringify({ pts, runs, heightFt, projectName })); setSavedMsg('Saved ✓'); }
    catch { setSavedMsg('Save failed'); }
    setTimeout(() => setSavedMsg(''), 2000);
  };
  const download = () => { const cv = cvRef.current!; const a = document.createElement('a'); a.download = `${projectName || 'glass'}-${view}.png`; a.href = cv.toDataURL('image/png'); a.click(); };

  let glass = 0, doorAdd = 0, area = 0;
  runs.forEach((r, i) => { const a = runLen(i) * heightFt; area += a; glass += a * (psfMap[r.system] ?? SYSTEMS[r.system].psf); doorAdd += DOORS[r.door].adder; });
  const labor = area * laborPsf; const sub = glass + doorAdd + labor; const tax = sub * taxPct / 100; const total = sub + tax;
  const usedSystems = Array.from(new Set(runs.map(r => r.system)));

  // Per-wall glass cut list (the "send to production" breakdown).
  const cutList = runs.map((r, i) => ({ i, run: r, wFt: runLen(i), pieces: wallGlass(r, runLen(i), heightFt) }));
  const totalPieces = cutList.reduce((s, w) => s + w.pieces.reduce((a, p) => a + p.qty, 0), 0);
  const cutNote = cutList.map(w => `Wall ${w.i + 1} (${SYSTEMS[w.run.system].name}, ${FINISHES[w.run.finish].name}): ` + w.pieces.map(p => `${p.qty}× ${fmtFt(p.w)}×${fmtFt(p.h)} ${p.label}`).join('; ')).join('  |  ');

  // Numbered opening schedule (BidUnity-style): each glass opening across every
  // wall gets a sequential tag O01, O02, … so the elevation drawing and the
  // schedule table cross-reference. wallOpenings[i] is the tag range per wall.
  const schedule: { op: string; wall: number; system: string; glass: string; finish: string; size: string; qty: number; label: string }[] = [];
  const wallOpenings: string[] = [];
  {
    let n = 0;
    for (const w of cutList) {
      const start = n + 1;
      for (const p of w.pieces) {
        n++;
        schedule.push({ op: `O${String(n).padStart(2, '0')}`, wall: w.i + 1, system: SYSTEMS[w.run.system].name, glass: SYSTEMS[w.run.system].note, finish: FINISHES[w.run.finish].name, size: `${fmtFt(p.w)} × ${fmtFt(p.h)}`, qty: p.qty, label: p.label });
      }
      wallOpenings[w.i] = n < start ? '' : n === start ? `O${String(start).padStart(2, '0')}` : `O${String(start).padStart(2, '0')}–O${String(n).padStart(2, '0')}`;
    }
  }
  const scheduleNote = schedule.map(o => `${o.op} · Wall ${o.wall} · ${o.qty}× ${o.label} · ${o.size} · ${o.system} ${o.finish}`).join('\n');

  // Open a clean, printable production / cut sheet in a new tab.
  const productionSheet = () => {
    const rows = cutList.map(w => {
      const head = `<tr><td colspan="4" style="background:#0e2a4a;color:#fff;padding:6px 8px;font-weight:600">Wall ${w.i + 1} — ${SYSTEMS[w.run.system].name} · ${FINISHES[w.run.finish].name} · ${SYSTEMS[w.run.system].note} · run ${fmtFt(w.wFt)}</td></tr>`;
      const body = w.pieces.map(p => `<tr><td style="text-align:center">${p.qty}</td><td>${p.label}</td><td>${fmtFt(p.w)}</td><td>${fmtFt(p.h)}</td></tr>`).join('');
      return head + body;
    }).join('');
    const schedRows = schedule.map(o => `<tr><td style="text-align:center;font-weight:600">${o.op}</td><td>Wall ${o.wall}</td><td>${o.system} · ${o.finish}</td><td>${o.label}</td><td style="text-align:center">${o.qty}</td><td>${o.size}</td></tr>`).join('');
    const html = `<!doctype html><meta charset="utf-8"><title>Production sheet — ${projectName || 'Glass enclosure'}</title>`
      + `<style>body{font:13px -apple-system,Segoe UI,sans-serif;padding:24px;color:#0f172a}h1{margin:0 0 2px}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #cbd5e1;padding:5px 8px;text-align:left}th{background:#f1f5f9}.muted{color:#64748b}.tot{margin-top:10px;font-weight:600}@media print{button{display:none}}</style>`
      + `<div style="display:flex;justify-content:space-between;align-items:center"><div><h1>${projectName || 'Glass enclosure'}</h1><div class="muted">Production / Cut Sheet</div></div><button onclick="print()" style="padding:8px 14px;border:1px solid #0e2a4a;background:#0e2a4a;color:#fff;border-radius:8px;cursor:pointer">Print / Save PDF</button></div>`
      + `<div class="muted" style="margin-top:6px">Height ${fmtFt(heightFt)} · ${runs.length} wall(s) · ${area.toFixed(0)} sq ft · ${schedule.length} openings · ${totalPieces} pieces</div>`
      + `<h3 style="margin:16px 0 0;font-size:14px">Opening schedule</h3>`
      + `<table><thead><tr><th style="width:46px;text-align:center">#</th><th style="width:70px">Location</th><th>System / Finish</th><th>Opening</th><th style="width:40px;text-align:center">Qty</th><th style="width:120px">Size</th></tr></thead><tbody>${schedRows}</tbody></table>`
      + `<h3 style="margin:16px 0 0;font-size:14px">Cut list by wall</h3>`
      + `<table><thead><tr><th style="width:48px;text-align:center">Qty</th><th>Piece</th><th style="width:90px">Width</th><th style="width:90px">Height</th></tr></thead><tbody>${rows}</tbody></table>`
      + `<p class="muted">Sizes are nominal opening sizes — apply shop deductions before cutting. Confirm field measurements before fabrication.</p>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.focus(); }
    else alert('Allow pop-ups to open the production sheet.');
  };

  const createEstimate = async () => {
    if (!clientId) { alert('Select a client first.'); return; }
    setSaving(true);
    try {
      const items: { description: string; quantity: number; unit_price: number }[] = [];
      runs.forEach((r, i) => { const L = runLen(i); const a = L * heightFt; items.push({ description: `Wall ${i + 1}: ${SYSTEMS[r.system].name} ${FINISHES[r.finish].name} — ${fmtFt(L)} × ${fmtFt(heightFt)} = ${a.toFixed(0)} sq ft`, quantity: Math.round(a * 10) / 10, unit_price: psfMap[r.system] ?? SYSTEMS[r.system].psf }); if (DOORS[r.door].leaves > 0) items.push({ description: `Wall ${i + 1}: ${DOORS[r.door].name}${r.transom ? ' + transom' : ''}${r.sidelites ? ' + sidelites' : ''}`, quantity: 1, unit_price: DOORS[r.door].adder }); });
      items.push({ description: 'Installation labor', quantity: Math.round(area * 10) / 10, unit_price: laborPsf });
      const today = new Date().toISOString().split('T')[0]; const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: parseInt(clientId), issue_date: today, due_date: due, type: 'estimate', items, tax_rate: taxPct, notes: `${projectName || 'Glass enclosure'} — ${runs.length} wall(s), ${area.toFixed(0)} sq ft. ${usedSystems.map(s => SYSTEMS[s].name).join(', ')}.\n\nOPENING SCHEDULE (${schedule.length} openings):\n${scheduleNote}\n\nCUT LIST (${totalPieces} pieces):\n${cutNote}`, terms: '50% deposit required. Estimate valid 30 days.' }) });
      if (!res.ok) { alert('Failed to create estimate'); return; }
      const inv = await res.json(); router.push(`/invoices/${inv.id}`);
    } catch { alert('Error'); } finally { setSaving(false); }
  };

  const seg = (active: boolean) => `px-2 py-1.5 rounded text-[11px] border transition-colors ${active ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-700 border-slate-200 hover:border-navy-400'}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flat Glass Estimator</h1>
          <p className="text-xs text-slate-500">Visual estimator · photo → dimensions → system → shape → realistic render → price. Close on site.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Client & Project</h2>
            <select className="select text-sm mb-2" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input text-sm mb-2" placeholder="Project name" value={projectName} onChange={e => setProjectName(e.target.value)} />
            <label className="text-[11px] text-slate-500">Wall height (ft)</label>
            <input type="number" className="input text-sm" value={heightFt} step={0.5} min={6} max={20} onChange={e => setHeightFt(+e.target.value || 9)} />
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Layout</h2>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => applyPreset('flat')} className={seg(false)}>▭ Flat wall</button>
              <button onClick={() => applyPreset('L')} className={seg(false)}>⌐ L-shape</button>
              <button onClick={() => applyPreset('C')} className={seg(false)}>⊐ C / U enclosure</button>
              <button onClick={editShape} className={seg(drawMode)}>✎ Draw / Edit</button>
            </div>
            {drawMode && (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-amber-600"><b>1.</b> Tap corners to sketch the walls · drag to adjust · lengths show on each line.</p>
                <div>
                  <label className="text-[11px] text-slate-500"><b>2.</b> Pick a glass system (applies to all walls)</label>
                  <select className="input text-sm mt-1" value={runs[0]?.system || 'storefront'} onChange={e => applySystemAll(e.target.value)}>
                    {Object.entries(SYSTEMS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
                <button onClick={convertToRender} disabled={pts.length < 2} className="btn-primary btn-sm w-full disabled:opacity-50">✨ 3. Convert to render</button>
              </div>
            )}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Walls</h2>
            <div className="flex flex-wrap gap-1 mb-2">
              {runs.map((r, i) => <button key={i} onClick={() => { setSel(i); if (view === 'plan') setView('elev'); }} className={seg(sel === i)} style={{ borderLeft: `3px solid ${SYSTEMS[r.system].color}` }}>Wall {i + 1}</button>)}
              {runs.length > 1 && <button onClick={() => { setRuns(rs => rs.filter((_, i) => i !== sel)); setPts(ps => ps.filter((_, i) => i !== sel + 1)); setSel(0); }} className="px-2 py-1.5 rounded text-[11px] text-red-500 border border-slate-200">✕</button>}
            </div>
            {runs.length > 0 && (
              <div className="border-t border-slate-100 pt-2 space-y-1">
                <label className="text-[11px] text-slate-500">Measurements — each line (ft)</label>
                {runs.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded px-1 ${sel === i ? 'bg-navy-50' : ''}`}>
                    <button onClick={() => setSel(i)} className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: SYSTEMS[r.system].color }} title={`Select wall ${i + 1}`} />
                    <span className="text-[11px] text-slate-600 w-12 flex-none">Wall {i + 1}</span>
                    <input type="number" className="input text-xs py-1 flex-1" value={Math.round(runLen(i) * 10) / 10} step={0.5} onChange={e => setRunLen(i, +e.target.value || 1)} />
                  </div>
                ))}
                <p className="text-[10px] text-slate-400">Type an exact length or drag a corner on the plan — the render &amp; cut list update live.</p>
              </div>
            )}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Wall {sel + 1} · System</h2>
            {Object.entries(SYSTEMS).map(([k, v]) => (
              <button key={k} onClick={() => setRun({ system: k })} className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 border ${run.system === k ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-700 border-slate-200 hover:border-navy-400'}`}>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />{v.name}</span><span className={run.system === k ? 'text-slate-300' : 'text-slate-400'}>${psfMap[k]}/sf</span></div>
              </button>
            ))}
            <div className="flex gap-2 mt-2">
              {Object.entries(FINISHES).map(([k, v]) => <button key={k} onClick={() => setRun({ finish: k })} title={v.name} className={`w-8 h-8 rounded-lg border-2 ${run.finish === k ? 'border-navy-600 ring-2 ring-navy-300' : 'border-slate-200'}`} style={{ background: v.face }} />)}
            </div>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Wall {sel + 1} · Door & Add-ons</h2>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(DOORS).map(([k, v]) => <button key={k} onClick={() => setRun({ door: k })} className={seg(run.door === k)}>{v.name}</button>)}
            </div>
            {DOORS[run.door].leaves > 0 && <>
              <label className="text-[11px] text-slate-500 block mt-2">Leaf width (ft each)</label>
              <input type="number" className="input text-sm" value={run.leafFt} step={0.25} min={2.5} max={4} onChange={e => setRun({ leafFt: +e.target.value || 3 })} />
              <div className="grid grid-cols-3 gap-1 mt-2">{(['left', 'center', 'right'] as const).map(p => <button key={p} onClick={() => setRun({ doorPos: p })} className={seg(run.doorPos === p) + ' capitalize'}>{p}</button>)}</div>
            </>}
            <button onClick={() => setRun({ transom: !run.transom })} className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-xs mt-2 ${run.transom ? 'border-navy-500 bg-navy-50' : 'border-slate-200'}`}>Transom<span className={`w-3 h-3 rounded-full ${run.transom ? 'bg-green-500' : 'bg-slate-300'}`} /></button>
            <button onClick={() => setRun({ sidelites: !run.sidelites })} className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-xs mt-2 ${run.sidelites ? 'border-navy-500 bg-navy-50' : 'border-slate-200'}`}>Sidelites<span className={`w-3 h-3 rounded-full ${run.sidelites ? 'bg-green-500' : 'bg-slate-300'}`} /></button>
            <label className="text-[11px] text-slate-500 block mt-2">Fixed panels: {run.panels}</label>
            <input type="range" min={1} max={5} value={run.panels} onChange={e => setRun({ panels: +e.target.value })} className="w-full accent-navy-600" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setView('plan')} className={`flex-1 py-2 rounded-lg text-sm border ${view === 'plan' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200'}`}>Plan</button>
            <button onClick={() => setView('elev')} className={`flex-1 py-2 rounded-lg text-sm border ${view === 'elev' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200'}`}>Elevation render</button>
            <button onClick={() => { setView('photo'); if (photo && !corners) { setPlacing(true); setTmp([]); } }} className={`flex-1 py-2 rounded-lg text-sm border ${view === 'photo' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200'}`}>On site photo</button>
          </div>
          {view === 'elev' && runs.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Show:</span>
              <button onClick={() => setElevSheet(true)} className={seg(elevSheet)}>▦ All walls (elevation sheet)</button>
              <button onClick={() => setElevSheet(false)} className={seg(!elevSheet)}>◳ Wall {sel + 1} only</button>
            </div>
          )}
          <div className="card overflow-hidden border-2 border-slate-200 relative">
            <canvas ref={cvRef} width={1000} height={720} style={{ touchAction: 'none' }} onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onPointerUp={onCanvasUp} onPointerLeave={onCanvasLeave} className="w-full block" />
            {placing && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-navy-900/90 text-white text-xs px-4 py-2 rounded-full pointer-events-none text-center">Tap the 4 corners of Wall {sel + 1}: TL → TR → BR → BL</div>}
            {view === 'plan' && drawMode && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white text-xs px-4 py-2 rounded-full pointer-events-none">Tap to add · drag to adjust · tap green corner to close</div>}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="btn-secondary btn-sm cursor-pointer text-center"><input type="file" accept="image/*" onChange={onPhoto} className="hidden" />📷 Site photo</label>
            {photo && view === 'photo' && <button onClick={() => { setCorners(null); setPlacing(true); setTmp([]); }} className="btn-secondary btn-sm">📐 Re-place</button>}
            {drawMode && <button onClick={undoPoint} disabled={pts.length === 0} className="btn-secondary btn-sm disabled:opacity-50">↶ Undo point</button>}
            {drawMode && <button onClick={convertToRender} disabled={pts.length < 2} className="btn-primary btn-sm disabled:opacity-50">✨ Convert to render</button>}
            {drawMode && <button onClick={() => setDrawMode(false)} disabled={pts.length < 2} className="btn-secondary btn-sm disabled:opacity-50">✓ Finish shape</button>}
            <button onClick={saveShape} disabled={pts.length < 2} className="btn-secondary btn-sm disabled:opacity-50">💾 Save</button>
            <button onClick={deleteShape} className="btn-secondary btn-sm text-red-600">🗑 Delete</button>
            <button onClick={download} className="btn-primary btn-sm flex-1">⬇ Download</button>
            {savedMsg && <span className="text-[11px] text-green-600 font-medium">{savedMsg}</span>}
          </div>
          <p className="text-[11px] text-slate-400 text-center">On the photo, the render maps onto <b>Wall {sel + 1}</b> — switch walls on the left to place each one.</p>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Live Estimate</h2>
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{runs.length} wall{runs.length > 1 ? 's' : ''}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{area.toFixed(0)} sq ft</span>
              {usedSystems.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: SYSTEMS[s].color }}>{SYSTEMS[s].name}</span>)}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Glass & frame</span><span className="font-medium">{money(glass)}</span></div>
              {doorAdd > 0 && <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Doors</span><span className="font-medium">{money(doorAdd)}</span></div>}
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Labor · {area.toFixed(0)} sf @ ${laborPsf}</span><span className="font-medium">{money(labor)}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Tax ({taxPct}%)</span><span>{money(tax)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{money(total)}</span></div>
            </div>
          </div>
          <button onClick={createEstimate} disabled={saving || !clientId} className="btn-primary w-full">{saving ? 'Creating...' : '📋 Create Estimate'}</button>

          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Glass cut list</h2>
              <button onClick={productionSheet} disabled={!runs.length} className="text-[11px] text-navy-700 font-medium hover:underline disabled:opacity-40">📄 Production sheet</button>
            </div>
            {cutList.length === 0 && <p className="text-[11px] text-slate-400">Draw or pick a shape to see the glass pieces.</p>}
            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {cutList.map(w => (
                <div key={w.i}>
                  <div className="text-[11px] font-semibold text-slate-700 pl-1.5" style={{ borderLeft: `3px solid ${SYSTEMS[w.run.system].color}` }}>Wall {w.i + 1} · {SYSTEMS[w.run.system].name} · {FINISHES[w.run.finish].name}</div>
                  {w.pieces.map((p, j) => (
                    <div key={j} className="flex justify-between text-[11px] pl-2.5">
                      <span className="text-slate-500">{p.qty}× {p.label}</span>
                      <span className="font-medium text-slate-800">{fmtFt(p.w)} × {fmtFt(p.h)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {cutList.length > 0 && (
              <div className="border-t border-slate-100 mt-2 pt-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Total pieces</span><span className="font-semibold">{totalPieces}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total glass</span><span className="font-semibold">{area.toFixed(0)} sq ft</span></div>
                <p className="text-[10px] text-slate-400 mt-1">Cut sizes save into the estimate &amp; the production sheet. Nominal opening sizes — apply shop deductions before cutting.</p>
              </div>
            )}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Opening schedule</h2>
            {schedule.length === 0 && <p className="text-[11px] text-slate-400">Openings appear here once you add walls.</p>}
            {schedule.length > 0 && (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="text-left font-medium py-1 px-1">#</th>
                      <th className="text-left font-medium px-1">Loc</th>
                      <th className="text-left font-medium px-1">Opening</th>
                      <th className="text-center font-medium px-1">Qty</th>
                      <th className="text-right font-medium px-1">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map(o => (
                      <tr key={o.op} className="border-b border-slate-50">
                        <td className="py-1 px-1 font-semibold text-navy-700">{o.op}</td>
                        <td className="px-1 text-slate-500">W{o.wall}</td>
                        <td className="px-1 text-slate-600">{o.label}<span className="block text-[10px] text-slate-400">{o.system} · {o.finish}</span></td>
                        <td className="px-1 text-center">{o.qty}</td>
                        <td className="px-1 text-right font-medium text-slate-800 whitespace-nowrap">{o.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Numbered openings match the elevation drawing — each wall label shows its O# range.</p>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Pricing (editable)</h2>
            {usedSystems.map(s => <div key={s} className="mb-1"><label className="text-[11px] text-slate-500">{SYSTEMS[s].name} $/sf</label><input type="number" className="input text-sm" value={psfMap[s]} onChange={e => setPsfMap(m => ({ ...m, [s]: +e.target.value || 0 }))} /></div>)}
            <label className="text-[11px] text-slate-500">Labor $/sf</label>
            <input type="number" className="input text-sm mb-1" value={laborPsf} onChange={e => setLaborPsf(+e.target.value || 0)} />
            <label className="text-[11px] text-slate-500">Tax %</label>
            <input type="number" className="input text-sm" value={taxPct} step={0.05} onChange={e => setTaxPct(+e.target.value || 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
