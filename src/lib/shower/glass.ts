// Shower shop-drawing geometry: turn an enclosure's measurements into accurate,
// order-ready glass panel sizes and to-scale quads for the elevation drawing.
// Pure functions, no deps — unit-testable.

import type { EnclosureConfig, Opening, OpeningKind, Deductions, ShowerStyle, GlassThickness, DoorType, HardwarePlacement } from './types';
import { DEFAULT_DEDUCTIONS, HW_STD, HINGE_TYPES, CLAMP_TYPES } from './types';

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
  role?: 'fixed' | 'sliding'; // sliding families: which lite moves
}

// A header / roller track above a sliding opening. An exposed (barn) track runs
// past the opening so the door can park clear; bypass/tub headers just span it.
export interface SlideTrack { x1: number; x2: number; y: number; exposed: boolean; }

// Which sliding family an enclosure uses (from the door type; defaults to bypass).
export type SlideFamily = 'bypass' | 'single-slider' | 'barn' | 'tub-slider';
export function slideFamily(cfg: EnclosureConfig): SlideFamily {
  const dt = cfg.doorType;
  if (dt === 'single-slider' || dt === 'barn' || dt === 'tub-slider') return dt;
  return 'bypass';
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

/**
 * Parse a shop-typed dimension into decimal inches. Accepts whole numbers,
 * decimals, and fractions in the forms dealers actually type:
 *   `79 1/4`  `79-1/4`  `79 1/4"`  `79.25`  `1/2`  `80 1/2"`  `79"`
 * Returns null when the text isn't a usable number (so callers can keep the
 * previous value while the user is mid-edit). Not rounded — exact custom cuts
 * (e.g. 79 1/4 = 79.25) are preserved.
 */
export function parseInches(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/["″”]/g, '').replace(/\s+/g, ' ').trim();
  if (s === '') return null;
  // whole + fraction, e.g. "79 1/4" or "79-1/4"
  let m = s.match(/^(\d+(?:\.\d+)?)[ -](\d+)\/(\d+)$/);
  if (m) { const d = parseFloat(m[3]); if (!d) return null; return parseFloat(m[1]) + parseFloat(m[2]) / d; }
  // bare fraction, e.g. "1/2"
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) { const d = parseFloat(m[2]); if (!d) return null; return parseFloat(m[1]) / d; }
  // plain number / decimal
  m = s.match(/^\d*\.?\d+$/);
  if (m) return parseFloat(s);
  return null;
}

// Round to 1/1000" — tames float noise while preserving any decimal of an inch
// the dealer enters (e.g. 79.35"), instead of snapping everything to 1/16.
export const r1000 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Format a size for order sheets / labels. If it lands cleanly on the 1/16"
 * grid, show the shop fraction (79 1/4"); otherwise show the exact decimal
 * (79.35") so no fraction of an inch is lost — for every glass type & config.
 */
export function formatDim(n: number): string {
  const v = Math.max(0, n);
  const sixteenth = Math.round(v * 16) / 16;
  if (Math.abs(v - sixteenth) < 1e-4) return formatIn(v);
  return `${r1000(v)}"`;
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
export function layoutEnclosure(cfg: EnclosureConfig): { panels: GlassPanel[]; totalW: number; maxH: number; track?: SlideTrack | null } {
  const { openings, deductions } = resolveMeasure(cfg);
  const fam = slideFamily(cfg);
  const panels: GlassPanel[] = [];
  let track: SlideTrack | null = null;
  let x = 0, maxH = 0;
  for (const o of openings) {
    const advance = Math.max(o.widthTop, o.widthBottom);
    maxH = Math.max(maxH, o.heightLeft, o.heightRight);
    const openingQuad: Quad = { tl: { x, y: 0 }, tr: { x: x + o.widthTop, y: 0 }, bl: { x, y: o.heightLeft }, br: { x: x + o.widthBottom, y: o.heightRight } };

    if (o.kind === 'sliding') {
      const overlap = deductions.slidingOverlap;
      const gh = r1000(o.heightLeft - deductions.panelTopGap - deductions.panelBottomGap);
      const top = deductions.panelTopGap, bot = o.heightLeft - deductions.panelBottomGap;
      const mk = (x0: number, w: number, label: string, role: 'fixed' | 'sliding'): GlassPanel => ({
        label, kind: 'sliding', wTop: w, wBottom: w, hLeft: gh, hRight: gh, square: true, role,
        openingQuad, glassQuad: { tl: { x: x0, y: top }, tr: { x: x0 + w, y: top }, bl: { x: x0, y: bot }, br: { x: x0 + w, y: bot } },
      });
      const halfW = r1000((o.widthTop + overlap) / 2);
      if (fam === 'single-slider') {
        // One fixed lite + one bypassing slider (equal panels).
        panels.push(mk(x, halfW, 'Fixed panel', 'fixed'));
        panels.push(mk(x + o.widthTop - halfW, halfW, 'Sliding panel', 'sliding'));
        track = { x1: x, x2: x + o.widthTop, y: 0, exposed: false };
      } else if (fam === 'barn') {
        // Fixed lite covers half; a barn door slides across an exposed track that
        // extends past the opening so the door parks clear of the entry.
        const fixedW = r1000(o.widthTop / 2);
        const doorW = r1000(o.widthTop / 2 + overlap);
        panels.push(mk(x, fixedW, 'Fixed panel', 'fixed'));
        panels.push(mk(x + o.widthTop - doorW, doorW, 'Barn door (sliding)', 'sliding'));
        track = { x1: x, x2: x + o.widthTop + fixedW, y: 0, exposed: true };
      } else if (fam === 'tub-slider') {
        panels.push(mk(x, halfW, 'Tub bypass (rear)', 'sliding'));
        panels.push(mk(x + o.widthTop - halfW, halfW, 'Tub bypass (front)', 'sliding'));
        track = { x1: x, x2: x + o.widthTop, y: 0, exposed: false };
      } else {
        // Bypass — two bypassing sliding panels.
        panels.push(mk(x, halfW, 'Sliding panel (rear)', 'sliding'));
        panels.push(mk(x + o.widthTop - halfW, halfW, 'Sliding panel (front)', 'sliding'));
        track = { x1: x, x2: x + o.widthTop, y: 0, exposed: false };
      }
    } else {
      const ins = insets(o.kind, deductions);
      const wTop = r1000(o.widthTop - ins.left - ins.right);
      const wBottom = r1000(o.widthBottom - ins.left - ins.right);
      const hLeft = r1000(o.heightLeft - ins.top - ins.bottom);
      const hRight = r1000(o.heightRight - ins.top - ins.bottom);
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
  return { panels, totalW: x, maxH, track };
}

// Extra sliding parts for the glass list / shop order: the header or exposed
// roller track that ships with a sliding family.
export function slidingExtras(cfg: EnclosureConfig): { label: string; size: string }[] {
  const { track } = layoutEnclosure(cfg);
  if (!track) return [];
  const len = Math.max(0, track.x2 - track.x1);
  return [{
    label: track.exposed ? 'Exposed roller track (barn)' : 'Header / track',
    size: `${formatIn(len)} long${track.exposed ? ' — extends past opening so the door parks clear' : ''}`,
  }];
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
    const h = r1000(Math.max(1, encH - pw.heightIn));
    rows.push({ label: '90° return (on pony wall)', size: `${formatDim(pw.returnWidthIn)} × ${formatDim(h)}` });
  }
  if (pw.notched) {
    const w = pw.panelWidthIn ?? 24, h = pw.panelHeightIn ?? encH;
    rows.push({ label: 'Notched panel (custom cut)', size: `${formatDim(w)} × ${formatDim(h)} — notch ${formatDim(pw.notchWidthIn)} × ${formatDim(pw.notchHeightIn)}` });
  }
  return rows;
}

// ---- Hardware layout: standard hole / hinge / clamp positions ----
// Build the standard placements from the door type, door height and the panels
// present. Dealers can then switch to custom and nudge any position. Pure math.
export function standardHardware(cfg: EnclosureConfig): HardwarePlacement[] {
  const hw = cfg.hardware;
  const { panels } = layoutEnclosure(cfg);
  const out: HardwarePlacement[] = [];
  const half = cfg.thickness === '1/2"';
  const hinge = HINGE_TYPES.find((h) => h.id === (hw?.hingeType || 'wall-geneva')) || HINGE_TYPES[0];
  const clampT = CLAMP_TYPES.find((c) => c.id === (hw?.clampType || 'glass-wall')) || CLAMP_TYPES[0];
  // A corner-return / neo-angle has a real 90° glass-to-glass joint on the return.
  const cornerJoint = cfg.style === 'corner-return' || cfg.style === 'neo-angle';
  panels.forEach((p, idx) => {
    const H = Math.max(1, p.hLeft || cfg.heightIn || 76);
    const W = Math.max(1, p.wTop || 24);
    if (p.kind === 'door') {
      const three = half || H >= HW_STD.tallDoorIn;
      // Hinges clamp the door edge — no door cutout (fab 'none'), mount per hinge type.
      const hy = [HW_STD.hingeInsetFromEndIn, ...(three ? [round16(H / 2)] : []), round16(Math.max(1, H - HW_STD.hingeInsetFromEndIn))];
      const hlabel = ['Top hinge', ...(three ? ['Center hinge'] : []), 'Bottom hinge'];
      hy.forEach((t, k) => out.push({ id: `hg-${idx}-${k}`, kind: 'hinge', label: hlabel[k], panel: 'door', panelIndex: idx, fromTopIn: t, fromEdgeIn: 0, fab: 'none', mount: hinge.mount }));
      // Back-to-back handle: two DRILLED holes, centered at handle height, CTC apart.
      const hCenter = round16(Math.max(1, H - (hw?.handleHeightIn ?? 40)));
      const ctc = hw?.handleCtcIn ?? 6;
      const edge = round16(Math.max(0, W - HW_STD.handleFromLatchEdgeIn));
      const dia = hw?.holeDiaIn ?? HW_STD.holeDiaIn;
      out.push({ id: `hn-${idx}-u`, kind: 'handle', label: 'Handle hole (upper)', panel: 'door', panelIndex: idx, fromTopIn: round16(Math.max(1, hCenter - ctc / 2)), fromEdgeIn: edge, diaIn: dia, fab: 'hole', mount: 'drilled' });
      out.push({ id: `hn-${idx}-l`, kind: 'handle', label: 'Handle hole (lower)', panel: 'door', panelIndex: idx, fromTopIn: round16(hCenter + ctc / 2), fromEdgeIn: edge, diaIn: dia, fab: 'hole', mount: 'drilled' });
    } else if (p.kind === 'panel' || p.kind === 'return') {
      // A glass-to-glass hinge notches the FIXED panel on the door side at each hinge.
      if (hinge.panelFab === 'notch' && idx > 0 && panels[idx - 1]?.kind === 'door') {
        const three = half || H >= HW_STD.tallDoorIn;
        const ny = [HW_STD.hingeInsetFromEndIn, ...(three ? [round16(H / 2)] : []), round16(Math.max(1, H - HW_STD.hingeInsetFromEndIn))];
        ny.forEach((t, k) => out.push({ id: `nt-${idx}-${k}`, kind: 'clamp', label: `Hinge notch ${k + 1} (glass-to-glass)`, panel: p.kind, panelIndex: idx, fromTopIn: t, fromEdgeIn: 0, fab: 'notch', mount: 'glass-to-glass hinge' }));
      }
      // Panel clamps grip the edge — no cutout. A corner return uses the joint's
      // real angle (neo-angle = 135°, corner-return = 90°); otherwise the chosen clamp.
      const mount = p.kind === 'return'
        ? (cfg.style === 'neo-angle' ? '135° neo corner' : cornerJoint ? '90° corner' : `${clampT.angle}°`)
        : `${clampT.angle}°${clampT.id === 'glass-wall' ? ' wall-mount' : ' glass-to-glass'}`;
      const n = Math.max(2, Math.min(3, hw?.clampsPerJoint ?? 2));
      for (let i = 0; i < n; i++) {
        const t = HW_STD.clampInsetFromEndIn + (i * (H - 2 * HW_STD.clampInsetFromEndIn)) / (n - 1);
        out.push({ id: `cl-${idx}-${i}`, kind: 'clamp', label: `${p.label} clamp ${i + 1}`, panel: p.kind, panelIndex: idx, fromTopIn: round16(t), fromEdgeIn: 0, fab: 'none', mount });
      }
    }
  });
  return out;
}

/** Resolve the placements to show: custom list if the dealer edited them,
 *  otherwise the standard auto-placed set. */
export function resolveHardware(cfg: EnclosureConfig): HardwarePlacement[] {
  const hw = cfg.hardware;
  if (!hw || !hw.enabled) return [];
  if (!hw.useStandard && hw.placements.length) return hw.placements;
  return standardHardware(cfg);
}

/** The fabrication requirement for one placement, in plain shop language. */
export function fabNote(h: HardwarePlacement): string {
  if (h.fab === 'hole') return `drill ⌀ ${formatDim(h.diaIn || 0.5).replace(/^0 /, '')}`;
  if (h.fab === 'notch') return `notch — ${h.mount || 'glass-to-glass'}`;
  return `no cutout${h.mount ? ` · ${h.mount}` : ''}`;
}

/** Hole / hinge / clamp positions + fabrication requirement as order-sheet rows. */
export function hardwareRows(cfg: EnclosureConfig): { label: string; size: string }[] {
  return resolveHardware(cfg).map((h) => ({
    label: h.label,
    size: `${formatDim(h.fromTopIn)} from top · ${formatDim(h.fromEdgeIn)} from edge · ${fabNote(h)}`,
  }));
}

/** Short summary of what actually needs glass fabrication (drilled/notched)
 *  vs. edge-clamp only — for the shop order header. */
export function fabSummary(cfg: EnclosureConfig): string {
  const places = resolveHardware(cfg);
  const holes = places.filter((p) => p.fab === 'hole').length;
  const notches = places.filter((p) => p.fab === 'notch').length;
  const parts: string[] = [];
  if (holes) parts.push(`${holes} drilled hole${holes > 1 ? 's' : ''}`);
  if (notches) parts.push(`${notches} notch${notches > 1 ? 'es' : ''}`);
  if (!parts.length) return 'No glass cutouts — all hardware is edge/surface clamp';
  return `Glass fabrication: ${parts.join(', ')} (all other hardware is edge clamp — no cutout)`;
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
  if (p.square) return `${formatDim(p.wTop)} x ${formatDim(p.hLeft)}`;
  return `top ${formatDim(p.wTop)} / bot ${formatDim(p.wBottom)} x L ${formatDim(p.hLeft)} / R ${formatDim(p.hRight)}`;
}
