// Shower estimator — domain types. Self-contained; no external deps.

export type ShowerStyle =
  | 'single-door'
  | 'door-inline-panel'
  | 'corner-return'
  | 'inline-3-panel'
  | 'neo-angle'
  | 'sliding-bypass';

export interface StyleDef {
  id: ShowerStyle;
  name: string;
  door: 'swing' | 'sliding';
  blurb: string;
  widths: string[];
}

export const SHOWER_STYLES: StyleDef[] = [
  { id: 'single-door', name: 'Single Door', door: 'swing', blurb: 'Frameless hinged door in an opening', widths: ['Door width'] },
  { id: 'door-inline-panel', name: 'Door + Panel', door: 'swing', blurb: 'Hinged door with an inline fixed panel', widths: ['Door width', 'Panel width'] },
  { id: 'corner-return', name: '90 Corner', door: 'swing', blurb: 'Door on one wall, return panel on the adjacent wall', widths: ['Door wall', 'Return wall'] },
  { id: 'inline-3-panel', name: 'Inline 3-Panel', door: 'swing', blurb: 'Panel + door + panel across a wide opening', widths: ['Left panel', 'Door width', 'Right panel'] },
  { id: 'neo-angle', name: 'Neo-Angle', door: 'swing', blurb: 'Five-sided angled corner enclosure', widths: ['Left wall', 'Front door', 'Right wall'] },
  { id: 'sliding-bypass', name: 'Sliding / Bypass', door: 'sliding', blurb: 'Two bypassing sliding panels', widths: ['Opening width'] },
];

export type GlassThickness = '3/8"' | '1/2"';
export type GlassType = 'clear' | 'low-iron' | 'frosted' | 'tinted';
export type Finish = 'chrome' | 'brushed-nickel' | 'matte-black' | 'oil-rubbed-bronze' | 'brass';

export const GLASS_TYPES: GlassType[] = ['clear', 'low-iron', 'frosted', 'tinted'];
export const THICKNESSES: GlassThickness[] = ['3/8"', '1/2"'];
export const FINISHES: { id: Finish; name: string }[] = [
  { id: 'chrome', name: 'Chrome' },
  { id: 'brushed-nickel', name: 'Brushed Nickel' },
  { id: 'matte-black', name: 'Matte Black' },
  { id: 'oil-rubbed-bronze', name: 'Oil-Rubbed Bronze' },
  { id: 'brass', name: 'Brass / Gold' },
];

export interface CutoutCounts {
  handleHoles: number;
  hingeCutouts: number;
  notches: number;
  towelBars: number;
}

export interface EnclosureConfig {
  id: string;
  label: string;
  style: ShowerStyle;
  widthsIn: number[];
  heightIn: number;
  thickness: GlassThickness;
  glass: GlassType;
  finish: Finish;
  extraHandles: number;
  cutouts: CutoutCounts;
  measure?: EnclosureMeasure;
}

// ---- Shop drawing / accurate glass sizing (additive, optional) ----
export type OpeningKind = 'door' | 'panel' | 'return' | 'sliding';

// One measured opening in the enclosure. widthTop/widthBottom differ when a wall
// is out of plumb; heightLeft/heightRight differ when the floor/curb is out of
// level. For a square opening all four collapse to width x height.
export interface Opening {
  kind: OpeningKind;
  label: string;
  widthTop: number;    // inches
  widthBottom: number; // inches
  heightLeft: number;  // inches
  heightRight: number; // inches
}

// Standard frameless gaps subtracted from the opening to get the ordered glass
// size. Editable per shop/hardware. Inches.
export interface Deductions {
  doorHingeGap: number;   // hinge side
  doorStrikeGap: number;  // strike/latch side (to panel or wall)
  doorTopGap: number;
  doorBottomGap: number;  // floor sweep clearance
  panelSideGap: number;   // wall side caulk joint (each side)
  panelTopGap: number;
  panelBottomGap: number;
  slidingOverlap: number; // bypass panel overlap at center
}

export const DEFAULT_DEDUCTIONS: Deductions = {
  doorHingeGap: 0.1875, doorStrikeGap: 0.1875, doorTopGap: 0.1875, doorBottomGap: 0.375,
  panelSideGap: 0.125, panelTopGap: 0.125, panelBottomGap: 0.375, slidingOverlap: 1,
};

// Optional detailed measurements for the shop drawing. When absent, openings are
// derived square from widthsIn/heightIn so old estimates still work.
export interface EnclosureMeasure {
  outOfSquare: boolean;
  openings: Opening[];
  deductions: Deductions;
}

export interface RateTable {
  glassPerSqft: Record<GlassThickness, Record<GlassType, number>>;
  hardware: {
    hinge: number;
    handle: number;
    connector: number;
    slidingKit: number;
    headerPerFt: number;
    towelBar: number;
  };
  fabrication: {
    handleHole: number;
    hingeCutout: number;
    notch: number;
  };
  labor: {
    installBase: number;
    installPerSqft: number;
  };
  finishUpchargePct: Record<Finish, number>;
}

export interface LineItem { label: string; qty: number; rate: number; amount: number; }
export interface EnclosureEstimate { config: EnclosureConfig; sqft: number; lineItems: LineItem[]; subtotal: number; }
export interface ProjectEstimate { enclosures: EnclosureEstimate[]; subtotal: number; }
