// Shower shop-drawing geometry: turn an enclosure's measurements into accurate,
// order-ready glass panel sizes and to-scale quads for the elevation drawing.
// Pure functions, no deps — unit-testable.

import type { EnclosureConfig, Opening, OpeningKind, Deductions, ShowerStyle, GlassThickness, DoorType } from './types';
import { DEFAULT_DEDUCTIONS } from './types';

const SLIDING_DOOR_TYPES: DoorType[] = ['single-slider', 'bypass', 'barn', 'tub-slider'];
export function isSlidingDoor(dt?: DoorType): boolean { return !!dt && SLIDING_DOOR_TYPES.includes(dt); }

export type Pt = { x: number; y: number };
export type Quad = { tl: Pt; tr: Pt; bl: Pt; br: Pt };

export interface GlassPanel {
  label: string;
  kind: OpeningKind;
  // Ordered glass edge sizes (inches, rounded to 1/16").
  wTop: number; wBottom: number; hLeft: number; hRight: number;
  square: boolean;           // all four edges reduce to a plain W x H
  openingQuad: Quad;         // measured opening, in enclosure inches (x from left, y down)
  glassQuad: Quad;           // glass after deductions
}

// Which lites each style is made of, left-to-right, matched to widthsIn order.
const STYLE_OPENINGS: Record<ShowerStyle, { kind: OpeningKind; label: string }[]> = {
  'single-door': [{ kind: 'door', label: 'Door' }],
  'door-inline-panel': [{ kind: 'door', label: 'Door' }, { kind: 'panel', label: 'Panel' }],
  'corner-return': [{ kind: 'door', label: 'Door wall' }, { kind: 'return', label: 'Return' }],
  'inline-3-panel': [{ kind: 'panel', label: 'Left panel' }, { kind: 'door', label: 'Door' }, { kind: 'panel', label: 'Right panel' }],
  'neo-angle': [{ kind: 'panel', label: 'Left' }, { kind: 'door', label: 'Front door' }, { kind: 'panel', label: 'Right' }],
  'sliding-bypass': [{ kind: 'sliding', label: 'Opening' }],
};

export const round16 = (n: number) => Math.round(n * 16) / 16;

/** Format inches to a shop-friendly fraction, e.g. 74.75 -> "74 3/4"". */
export function formatIn(n: number): string {
  const v = round16(Math.max(0, n));
  const whole = Math.floor(v);
  let num = Math.round((v - whole) * 16), den = 16;
  while (num > 0 && num % 2 === 0) { num /= 2; den /= 2; }
  return num ? `${whole} ${num}/${den}"` : `${whole}"`;
}

/** Square openings derived from the simple width/height fields (no out-of-square). */
export function defaultOpenings(cfg: EnclosureConfig): Opening[] {
  const defs = STYLE_OPENINGS[cfg.style] || [{ kind: 'panel', label: 'Panel' }];
  const h = cfg.heightIn || 76;
  const openings: Opening[] = defs.map((d, i) => {
    const w = cfg.widthsIn[i] ?? cfg.widthsIn[cfg.widthsIn.length - 1] ?? 30;
    return { kind: d.kind, label: d.label, widthTop: w, widthBottom: w, heightLeft: h, heightRight: h };
  });
  // A sliding door type renders the door opening as bypassing panels.
  if (isSlidingDoor(cfg.doorType)) {
    return openings.map((o) => (o.kind === 'door' ? { ...o, kind: 'sliding' as OpeningKind, label: o.label === 'Door' ? 'Sliding' : o.label } : o));
  }
  return openings;
}

/** Resolve the working measurement set. Out-of-square mode uses the stored
 *  per-opening measurements; otherwise openings stay live-derived from the
 *  width/height fields. Custom deductions apply in either mode. */
export function resolveMeasure(cfg: EnclosureConfig): { outOfSquare: boolean; openings: Opening[]; deductions: Deductions } {
  const deductions = { ...DEFAULT_DEDUCTIONS, ...(cfg.measure?.deductions || {}) };
  if (cfg.measure?.outOfSquare && Array.isArray(cfg.measure.openings) && cfg.measure.openings.length) {
    return { outOfSquare: true, openings: cfg.measure.openings, deductions };
  }
  return { outOfSquare: false, openings: defaultOpenings(cfg), deductions };
}

function insets(kind: OpeningKind, d: Deductions) {
  if (kind === 'door') return { left: d.doorHingeGap, right: d.doorStrikeGap, top: d.doorTopGap, bottom: d.doorBottomGap };
  return { left: d.panelSideGap, right: d.panelSideGap, top: d.panelTopGap, bottom: d.panelBottomGap };
}

function isSquare(o: Opening) { return Math.abs(o.widthTop - o.widthBottom) < 1e-6 && Math.abs(o.heightLeft - o.heightRight) < 1e-6; }

/**
 * Lay the enclosure out left-to-right and compute each glass panel's ordered
 * size + drawing quads. Sliding openings yield two bypassing panels.
 */
export function layoutEnclosure(cfg: EnclosureConfig): { panels: GlassPanel[]; totalW: number; maxH: number } {
  const { openings, deductions } = resolveMeasure(cfg);
  const panels: GlassPanel[] = [];
  let x = 0, maxH = 0;
  for (const o of openings) {
    const advance = Math.max(o.widthTop, o.widthBottom);
    maxH = Math.max(maxH, o.heightLeft, o.heightRight);
    const openingQuad: Quad = { tl: { x, y: 0 }, tr: { x: x + o.widthTop, y: 0 }, bl: { x, y: o.heightLeft }, br: { x: x + o.widthBottom, y: o.heightRight } };

    if (o.kind === 'sliding') {
      // Two bypass panels; each ~ (opening + overlap)/2, square opening assumed.
      const panelW = round16((o.widthTop + deductions.slidingOverlap) / 2);
      const gh = round16(o.heightLeft - deductions.panelTopGap - deductions.panelBottomGap);
      const top = deductions.panelTopGap, bot = o.heightLeft - deductions.panelBottomGap;
      const mk = (x0: number, label: string): GlassPanel => ({
        label, kind: 'sliding', wTop: panelW, wBottom: panelW, hLeft: gh, hRight: gh, square: true,
        openingQuad, glassQuad: { tl: { x: x0, y: top }, tr: { x: x0 + panelW, y: top }, bl: { x: x0, y: bot }, br: { x: x0 + panelW, y: bot } },
      });
      panels.push(mk(x, 'Sliding panel (rear)'));
      panels.push(mk(x + o.widthTop - panelW, 'Sliding panel (front)'));
    } else {
      const ins = insets(o.kind, deductions);
      const wTop = round16(o.widthTop - ins.left - ins.right);
      const wBottom = round16(o.widthBottom - ins.left - ins.right);
      const hLeft = round16(o.heightLeft - ins.top - ins.bottom);
      const hRight = round16(o.heightRight - ins.top - ins.bottom);
      const gq: Quad = {
        tl: { x: x + ins.left, y: ins.top },
        tr: { x: x + o.widthTop - ins.right, y: ins.top },
        bl: { x: x + ins.left, y: o.heightLeft - ins.bottom },
        br: { x: x + o.widthBottom - ins.right, y: o.heightRight - ins.bottom },
      };
      panels.push({ label: o.label, kind: o.kind, wTop, wBottom, hLeft, hRight, square: isSquare(o), openingQuad, glassQuad: gq });
    }
    x += advance;
  }
  return { panels, totalW: x, maxH };
}

// Suggest glass thickness: 1/2" once any panel is tall (> 80") or a span is very
// wide (> 60"); otherwise 3/8" (the residential standard). See SHOWER-V2-PLAN.
export function suggestThickness(cfg: EnclosureConfig): GlassThickness {
  const { openings } = resolveMeasure(cfg);
  const heights = [cfg.heightIn || 0, cfg.openingHeightIn || 0, ...openings.flatMap((o) => [o.heightLeft, o.heightRight])];
  const spans = [...(cfg.widthsIn || []), cfg.openingWidthIn || 0, ...openings.flatMap((o) => [o.widthTop, o.widthBottom])];
  const maxH = Math.max(0, ...heights), maxSpan = Math.max(0, ...spans);
  return maxH > 80 || maxSpan > 60 ? '1/2"' : '3/8"';
}

// Extra glass pieces for a pony/knee-wall enclosure: the 90° return that sits on
// top of the knee wall, and the notched (custom-cut) panel beside the door.
export function ponyWallRows(cfg: EnclosureConfig): { label: string; size: string }[] {
  const pw = cfg.ponyWall;
  if (!pw) return [];
  const encH = cfg.heightIn || 76;
  const rows: { label: string; size: string }[] = [];
  if (pw.hasReturn) {
    const h = round16(Math.max(1, encH - pw.heightIn));
    rows.push({ label: '90° return (on pony wall)', size: `${formatIn(pw.returnWidthIn)} × ${formatIn(h)}` });
  }
  if (pw.notched) {
    const w = pw.panelWidthIn ?? 24, h = pw.panelHeightIn ?? encH;
    rows.push({ label: 'Notched panel (custom cut)', size: `${formatIn(w)} × ${formatIn(h)} — notch ${formatIn(pw.notchWidthIn)} × ${formatIn(pw.notchHeightIn)}` });
  }
  return rows;
}

// ---- Top-down plan (footprint) ----
export interface PlanSeg { kind: OpeningKind; label: string; a: Pt; b: Pt; len: number; nomLen: number; door: boolean; }
export interface PlanLayout { segs: PlanSeg[]; minX: number; maxX: number; minY: number; maxY: number; }

/**
 * Wall segments for the bird's-eye footprint. Inline styles lay along one wall;
 * the 90 corner makes an L; neo-angle makes an angled triangle. Uses nominal
 * widths (the plan is a footprint schematic — exact glass sizes live in the
 * elevation/cut list).
 */
export function planWalls(cfg: EnclosureConfig): PlanLayout {
  const defs = STYLE_OPENINGS[cfg.style] || [{ kind: 'panel' as OpeningKind, label: 'Panel' }];
  const w = (i: number) => cfg.widthsIn[i] ?? cfg.widthsIn[cfg.widthsIn.length - 1] ?? 30;
  const segs: PlanSeg[] = [];
  const push = (kind: OpeningKind, label: string, a: Pt, b: Pt, nomLen: number) =>
    segs.push({ kind, label, a, b, len: Math.hypot(b.x - a.x, b.y - a.y), nomLen, door: kind === 'door' });

  if (cfg.style === 'corner-return') {
    const dw = w(0), rw = w(1);
    push('door', defs[0]?.label || 'Door wall', { x: dw, y: 0 }, { x: 0, y: 0 }, dw);
    push('return', defs[1]?.label || 'Return', { x: 0, y: 0 }, { x: 0, y: rw }, rw);
  } else if (cfg.style === 'neo-angle') {
    const L = w(0), D = w(1), R = w(2);
    push('panel', defs[0]?.label || 'Left', { x: 0, y: 0 }, { x: 0, y: L }, L);
    push('door', defs[1]?.label || 'Front door', { x: 0, y: L }, { x: R, y: 0 }, D);
    push('panel', defs[2]?.label || 'Right', { x: R, y: 0 }, { x: 0, y: 0 }, R);
  } else {
    let x = 0;
    defs.forEach((d, i) => { const ww = w(i); push(d.kind, d.label, { x, y: 0 }, { x: x + ww, y: 0 }, ww); x += ww; });
  }
  const xs = segs.flatMap((s) => [s.a.x, s.b.x]), ys = segs.flatMap((s) => [s.a.y, s.b.y]);
  return { segs, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Styles whose footprint is worth a plan view (not a plain straight wall). */
export function planIsInformative(cfg: EnclosureConfig): boolean {
  return cfg.style === 'corner-return' || cfg.style === 'neo-angle';
}

/** A concise ordered-size string for a panel (single W x H, or 4 edges if out of square). */
export function panelSizeLabel(p: GlassPanel): string {
  if (p.square) return `${formatIn(p.wTop)} x ${formatIn(p.hLeft)}`;
  return `top ${formatIn(p.wTop)} / bot ${formatIn(p.wBottom)} x L ${formatIn(p.hLeft)} / R ${formatIn(p.hRight)}`;
}
