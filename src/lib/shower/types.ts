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
