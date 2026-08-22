// Glass Replacement estimator — pricing engine and defaults.
//
// Prices glass the way glaziers actually do: by UNITED INCHES (width + height,
// each rounded up to the next inch) times a per-united-inch rate that depends on
// the glass type, with a per-type minimum charge. Handles rectangle / circle /
// ellipse shapes, a tempered upcharge, and a grille/grid option.
//
// Everything here is pure and framework-free so it can be unit-reasoned and
// reused. Rates are the SHOP'S to edit — the defaults below are only a starting
// point (illustrative, not Eagles Glass's real numbers).

export type Shape = 'rectangle' | 'circle' | 'ellipse';
export type GridSize = 'none' | '5/8' | '3/4' | '1';

export interface GlassType {
  id: string;
  name: string;          // e.g. "Clear 1/4\"", "Low-E IGU (double pane)"
  ratePerUI: number;     // $ per united inch
  minCharge: number;     // $ floor per lite
  temperMultiplier: number; // multiply the glass price when tempered (e.g. 1.8)
  custom?: boolean;      // true if the shop added it
}

export interface LineItem {
  id: string;
  typeId: string;
  shape: Shape;
  // Dimensions in decimal inches. For a circle, `width` is the diameter (height ignored).
  // For an ellipse, width = major axis, height = minor axis.
  width: number;
  height: number;
  qty: number;
  tempered: boolean;
  grid: GridSize;
  note?: string;
}

// The 16ths a shop can pick for each dimension.
export const SIXTEENTHS: { label: string; value: number }[] = Array.from({ length: 16 }, (_, i) => ({
  label: i === 0 ? '0' : reduceFraction(i, 16),
  value: i / 16,
}));

function reduceFraction(n: number, d: number): string {
  const g = gcd(n, d);
  return `${n / g}/${d / g}`;
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Combine a whole-inch value and a sixteenth fraction into decimal inches. */
export function toInches(whole: number, sixteenth: number): number {
  return (Number(whole) || 0) + (Number(sixteenth) || 0);
}

/** Split decimal inches back into { whole, sixteenth } for the pickers. */
export function fromInches(value: number): { whole: number; sixteenth: number } {
  const v = Math.max(0, Number(value) || 0);
  const whole = Math.floor(v);
  const sixteenth = Math.round((v - whole) * 16) / 16;
  return { whole, sixteenth };
}

const ceilInch = (n: number) => Math.ceil(Number(n) || 0);

/** United inches for a lite, by shape. Each dimension is rounded up to the inch. */
export function unitedInches(item: Pick<LineItem, 'shape' | 'width' | 'height'>): number {
  switch (item.shape) {
    case 'circle':
      // Bounding square of the diameter.
      return ceilInch(item.width) * 2;
    case 'ellipse':
      return ceilInch(item.width) + ceilInch(item.height);
    case 'rectangle':
    default:
      return ceilInch(item.width) + ceilInch(item.height);
  }
}

export interface GridPricing {
  ratePerUI: number; // grid upcharge per united inch when a grid is selected
}

export const DEFAULT_GRID_PRICING: GridPricing = { ratePerUI: 0.4 };

/** Price a single line (all quantities). Returns the extended $ for the line. */
export function priceLine(
  item: LineItem,
  types: GlassType[],
  grid: GridPricing = DEFAULT_GRID_PRICING,
): number {
  const t = types.find((x) => x.id === item.typeId);
  if (!t) return 0;
  const ui = unitedInches(item);
  let each = ui * t.ratePerUI;
  if (item.tempered) each *= t.temperMultiplier || 1;
  if (item.grid !== 'none') each += ui * (grid.ratePerUI || 0);
  each = Math.max(each, t.minCharge || 0);
  const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
  return round2(each * qty);
}

export interface QuoteTotals {
  subtotal: number;
  taxRate: number; // percent, e.g. 8.25
  taxAmount: number;
  total: number;
}

export function quoteTotals(lines: number[], taxRatePct: number): QuoteTotals {
  const subtotal = round2(lines.reduce((s, n) => s + (n || 0), 0));
  const taxRate = Number(taxRatePct) || 0;
  const taxAmount = round2(subtotal * (taxRate / 100));
  return { subtotal, taxRate, taxAmount, total: round2(subtotal + taxAmount) };
}

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function money(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
  } catch {
    return `$${(Number(n) || 0).toFixed(2)}`;
  }
}

/** Illustrative starter rates — every shop should edit these to its own pricing. */
export const DEFAULT_GLASS_TYPES: GlassType[] = [
  { id: 'clear-18', name: 'Clear 1/8"', ratePerUI: 0.55, minCharge: 25, temperMultiplier: 2.0 },
  { id: 'clear-316', name: 'Clear 3/16"', ratePerUI: 0.75, minCharge: 30, temperMultiplier: 2.0 },
  { id: 'clear-14', name: 'Clear 1/4"', ratePerUI: 0.95, minCharge: 35, temperMultiplier: 1.9 },
  { id: 'clear-12', name: 'Clear 1/2"', ratePerUI: 3.5, minCharge: 90, temperMultiplier: 1.8 },
  { id: 'igu-clear', name: 'Clear IGU (double pane)', ratePerUI: 2.75, minCharge: 85, temperMultiplier: 1.6 },
  { id: 'igu-lowe', name: 'Low-E IGU (double pane)', ratePerUI: 3.25, minCharge: 95, temperMultiplier: 1.6 },
  { id: 'mirror-14', name: 'Mirror 1/4"', ratePerUI: 1.25, minCharge: 40, temperMultiplier: 1.0 },
  { id: 'obscure-14', name: 'Obscure / Patterned 1/4"', ratePerUI: 1.6, minCharge: 45, temperMultiplier: 1.9 },
  { id: 'laminated-14', name: 'Laminated 1/4"', ratePerUI: 2.75, minCharge: 70, temperMultiplier: 1.0 },
  { id: 'tempered-14', name: 'Tempered 1/4" (storefront)', ratePerUI: 2.1, minCharge: 60, temperMultiplier: 1.0 },
];

export function newLine(typeId: string): LineItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    typeId,
    shape: 'rectangle',
    width: 24,
    height: 36,
    qty: 1,
    tempered: false,
    grid: 'none',
  };
}
