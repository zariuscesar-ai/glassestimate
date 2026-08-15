// Finger-sketch → system: turn a rough freehand plan-view stroke (drawn on an
// iPad or with a mouse) into a clean set of wall segments, then classify it into
// one of the shower styles with proportional wall widths. Pure geometry, no deps
// — unit-testable and reused by the SketchPad component.

import type { ShowerStyle } from './types';

export interface Pt { x: number; y: number }

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Perpendicular distance from p to the line through a-b. */
function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1e-9;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

/** Ramer–Douglas–Peucker simplification: drop points closer than epsilon to the
 *  chord. Returns a reduced polyline preserving corners. */
export function simplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points.slice();
  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > epsilon) {
    const left = simplify(points.slice(0, idx + 1), epsilon);
    const right = simplify(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

/** Bounding-box diagonal — used to scale epsilon so simplification is
 *  resolution-independent. */
export function bboxDiag(points: Pt[]): number {
  if (!points.length) return 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  return Math.hypot(maxX - minX, maxY - minY);
}

/** Snap each segment's heading to the nearest 45° and rebuild the polyline from
 *  the first point, preserving each segment's length. A rough finger line becomes
 *  clean 0/45/90 walls. */
export function snapPolyline(points: Pt[]): Pt[] {
  if (points.length < 2) return points.slice();
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = out[i - 1], b = points[i];
    const len = dist(a, b);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const snapped = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
    out.push({ x: a.x + Math.cos(snapped) * len, y: a.y + Math.sin(snapped) * len });
  }
  return out;
}

export interface Seg { a: Pt; b: Pt; len: number; angleDeg: number }

/** Break a polyline into directed segments with length + heading (0–360°). */
export function toSegments(points: Pt[]): Seg[] {
  const segs: Seg[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    segs.push({ a, b, len: dist(a, b), angleDeg: deg });
  }
  return segs;
}

/** Merge consecutive segments whose headings are within tol degrees (same wall
 *  drawn as a slightly wobbly line). */
export function mergeCollinear(points: Pt[], tolDeg = 10): Pt[] {
  const segs = toSegments(points);
  if (segs.length < 2) return points.slice();
  const kept: Pt[] = [points[0]];
  for (let i = 0; i < segs.length; i++) {
    const next = segs[i + 1];
    const cur = segs[i];
    if (next) {
      let d = Math.abs(cur.angleDeg - next.angleDeg);
      if (d > 180) d = 360 - d;
      if (d < tolDeg) { segs[i + 1] = { a: cur.a, b: next.b, len: dist(cur.a, next.b), angleDeg: next.angleDeg }; continue; }
    }
    kept.push(cur.b);
  }
  return kept;
}

/** Drop tiny segments (noise / hooks at the ends of a stroke). */
function dropTiny(points: Pt[], minLen: number): Pt[] {
  if (points.length < 3) return points.slice();
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (i === points.length - 1 || dist(out[out.length - 1], points[i]) >= minLen) out.push(points[i]);
  }
  return out;
}

/** Clean a raw stroke into ordered wall corners (simplify → snap → merge). */
export function cleanStroke(raw: Pt[]): Pt[] {
  if (raw.length < 2) return raw.slice();
  const diag = bboxDiag(raw) || 1;
  const simplified = simplify(raw, diag * 0.045);
  const snapped = snapPolyline(simplified);
  const merged = mergeCollinear(snapped, 12);
  return dropTiny(merged, diag * 0.08);
}

export interface SketchResult {
  style: ShowerStyle;
  widthsIn: number[];
  detected: string;   // human label for the detected system
  corners: Pt[];      // cleaned polyline (for the overlay)
}

/** Scale cleaned segment pixel-lengths to inches so the longest wall ≈ 60",
 *  others proportional (min 6"), rounded to whole inches. The dealer fine-tunes
 *  exact sizes afterward. */
function scaleWidths(segs: Seg[]): number[] {
  const max = Math.max(1, ...segs.map((s) => s.len));
  return segs.map((s) => Math.max(6, Math.round((s.len / max) * 60)));
}

/**
 * Classify a cleaned polyline into a shower style + wall widths.
 *  1 wall            → Door + panel (inline)
 *  2 walls, ~90°     → 90° corner / return
 *  3 walls, diagonal → Neo-angle
 *  3 walls, squared  → Inline 3-panel
 * Falls back to a single door when the stroke is too small to read.
 */
export function classify(raw: Pt[]): SketchResult {
  return classifyRaw(cleanStroke(raw));
}

/**
 * Classify an already-clean set of corners (from tap-to-place) into a shower
 * style + proportional wall widths — WITHOUT re-simplifying, so the shape the
 * dealer placed is preserved.
 *  1 wall            → Door + panel (inline)
 *  2 walls, ~90°     → 90° corner / return
 *  2–3 walls, diagonal → Neo-angle
 *  3 walls, squared  → Inline 3-panel
 */
export function classifyRaw(corners: Pt[]): SketchResult {
  const segs = toSegments(corners);
  const widths = scaleWidths(segs);
  const isDiagonal = (s: Seg) => { const m = ((Math.round(s.angleDeg) % 90) + 90) % 90; return Math.min(m, 90 - m) > 20; };
  const anyDiagonal = segs.some(isDiagonal);

  if (segs.length <= 0) return { style: 'single-door', widthsIn: [30], detected: 'Single door', corners };
  if (segs.length === 1) return { style: 'door-inline-panel', widthsIn: [widths[0], Math.max(6, Math.round(widths[0] * 0.7))], detected: 'Door + panel', corners };
  if (segs.length === 2) {
    if (anyDiagonal) return { style: 'neo-angle', widthsIn: [widths[0], widths[1], widths[0]], detected: 'Neo-angle', corners };
    return { style: 'corner-return', widthsIn: [widths[0], widths[1]], detected: '90° corner / return', corners };
  }
  if (anyDiagonal) return { style: 'neo-angle', widthsIn: [widths[0], widths[1], widths[2]], detected: 'Neo-angle', corners };
  return { style: 'inline-3-panel', widthsIn: [widths[0], widths[1], widths[2]], detected: 'Inline 3-panel', corners };
}
