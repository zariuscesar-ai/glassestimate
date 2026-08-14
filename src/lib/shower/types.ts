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
  // ---- v2 (optional, additive) ----
  doorType?: DoorType;         // hinged / slider family / fixed
  openingWidthIn?: number;     // rough opening, wall-to-wall
  openingHeightIn?: number;    // floor-to-header
  sizeFromOpening?: boolean;   // size the glass from the opening (vs panel-first)
  ponyWall?: PonyWall;         // knee-wall + 90° return + notched panel
  hardware?: HardwareLayout;   // adjustable hole / hinge / clamp positions
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

// ---- Door types & standard sizes (v2) ----
export type DoorType = 'none' | 'hinged' | 'pivot' | 'single-slider' | 'bypass' | 'barn' | 'tub-slider';

export const DOOR_TYPES: { id: DoorType; name: string; blurb: string; sliding: boolean }[] = [
  { id: 'hinged', name: 'Hinged / Swing', blurb: 'Frameless hinged door (22–36")', sliding: false },
  { id: 'pivot', name: 'Pivot', blurb: 'Pivot-hinged door', sliding: false },
  { id: 'single-slider', name: 'Single Slider', blurb: 'One sliding panel bypassing one fixed', sliding: true },
  { id: 'bypass', name: 'Bypass (two sliding)', blurb: 'Two bypassing sliding panels', sliding: true },
  { id: 'barn', name: 'Barn (top-hung)', blurb: 'Top-hung roller on an exposed track', sliding: true },
  { id: 'tub-slider', name: 'Tub Slider', blurb: 'Bypass doors over a bathtub', sliding: true },
  { id: 'none', name: 'Fixed panel (no door)', blurb: 'Fixed glass only', sliding: false },
];

export interface StandardSize { label: string; widthIn: number; heightIn: number; }

// Standard opening sizes by door family (inches). "Custom" lets the shop type its own.
export const STANDARD_SIZES: Record<DoorType, StandardSize[]> = {
  hinged: [
    { label: '22" × 72"', widthIn: 22, heightIn: 72 },
    { label: '24" × 72"', widthIn: 24, heightIn: 72 },
    { label: '24" × 74"', widthIn: 24, heightIn: 74 },
    { label: '26" × 72"', widthIn: 26, heightIn: 72 },
    { label: '26" × 76"', widthIn: 26, heightIn: 76 },
    { label: '28" × 72"', widthIn: 28, heightIn: 72 },
    { label: '28" × 76"', widthIn: 28, heightIn: 76 },
    { label: '30" × 72"', widthIn: 30, heightIn: 72 },
    { label: '30" × 74"', widthIn: 30, heightIn: 74 },
    { label: '30" × 76"', widthIn: 30, heightIn: 76 },
    { label: '32" × 72"', widthIn: 32, heightIn: 72 },
    { label: '32" × 76"', widthIn: 32, heightIn: 76 },
    { label: '32" × 78"', widthIn: 32, heightIn: 78 },
    { label: '34" × 76"', widthIn: 34, heightIn: 76 },
    { label: '34" × 78"', widthIn: 34, heightIn: 78 },
    { label: '36" × 72"', widthIn: 36, heightIn: 72 },
    { label: '36" × 76"', widthIn: 36, heightIn: 76 },
    { label: '36" × 78"', widthIn: 36, heightIn: 78 },
  ],
  pivot: [
    { label: '28" × 76"', widthIn: 28, heightIn: 76 },
    { label: '30" × 76"', widthIn: 30, heightIn: 76 },
    { label: '32" × 78"', widthIn: 32, heightIn: 78 },
    { label: '34" × 78"', widthIn: 34, heightIn: 78 },
    { label: '36" × 78"', widthIn: 36, heightIn: 78 },
    { label: '36" × 80"', widthIn: 36, heightIn: 80 },
  ],
  'single-slider': [
    { label: '48" × 72"', widthIn: 48, heightIn: 72 },
    { label: '56" × 72"', widthIn: 56, heightIn: 72 },
    { label: '60" × 76"', widthIn: 60, heightIn: 76 },
  ],
  bypass: [
    { label: '56⅝" × 72"', widthIn: 56.625, heightIn: 72 },
    { label: '60" × 76"', widthIn: 60, heightIn: 76 },
    { label: '72" × 76"', widthIn: 72, heightIn: 76 },
  ],
  barn: [
    { label: '48" × 76"', widthIn: 48, heightIn: 76 },
    { label: '60" × 78"', widthIn: 60, heightIn: 78 },
    { label: '72" × 78"', widthIn: 72, heightIn: 78 },
  ],
  'tub-slider': [
    { label: '56" × 58"', widthIn: 56, heightIn: 58 },
    { label: '60" × 58"', widthIn: 60, heightIn: 58 },
    { label: '60" × 62"', widthIn: 60, heightIn: 62 },
  ],
  none: [
    { label: '24" × 72"', widthIn: 24, heightIn: 72 },
    { label: '36" × 76"', widthIn: 36, heightIn: 76 },
    { label: '48" × 76"', widthIn: 48, heightIn: 76 },
  ],
};

// Pony / knee-wall config: glass sits on a half wall, with an optional 90° return
// and a notched panel (custom cut) beside the door.
export interface PonyWall {
  heightIn: number;       // knee-wall height from floor
  hasReturn: boolean;     // 90° return panel on the knee wall
  returnWidthIn: number;
  notched: boolean;       // notched glass panel beside the door (custom cut)
  notchWidthIn: number;
  notchHeightIn: number;
  panelWidthIn?: number;  // notched panel overall width
  panelHeightIn?: number; // notched panel overall height
}

export const DEFAULT_PONY_WALL: PonyWall = {
  heightIn: 42, hasReturn: true, returnWidthIn: 30, notched: true,
  notchWidthIn: 6, notchHeightIn: 42, panelWidthIn: 24, panelHeightIn: 76,
};

// ---- Popular models (quick-pick presets) ----
// Brand-neutral configs modeled on the frameless systems shops sell most (the
// familiar CRL "Geneva / Cambridge / Melrose / Serenity / Crescent" families).
// Picking one just seeds style + door type + a common size + glass + finish;
// everything stays fully editable afterward. Additive — nothing else depends on it.
export interface PopularModel {
  id: string;
  name: string;
  blurb: string;
  doorType: DoorType;
  style: ShowerStyle;
  widthIn: number;
  heightIn: number;
  thickness: GlassThickness;
  finish: Finish;
}

export const POPULAR_MODELS: PopularModel[] = [
  { id: 'geneva-door', name: 'Geneva-Style Door', blurb: 'Frameless wall-mount hinged door', doorType: 'hinged', style: 'single-door', widthIn: 30, heightIn: 76, thickness: '3/8"', finish: 'chrome' },
  { id: 'cambridge-door-panel', name: 'Cambridge-Style Door + Panel', blurb: 'Hinged door with inline fixed panel', doorType: 'hinged', style: 'door-inline-panel', widthIn: 30, heightIn: 76, thickness: '3/8"', finish: 'brushed-nickel' },
  { id: 'junior-90-return', name: '90° Return (Junior-Style)', blurb: 'Door + return panel on the adjacent wall', doorType: 'hinged', style: 'corner-return', widthIn: 30, heightIn: 76, thickness: '3/8"', finish: 'chrome' },
  { id: 'melrose-inline-3', name: 'Melrose-Style Inline 3-Panel', blurb: 'Panel + door + panel across a wide opening', doorType: 'hinged', style: 'inline-3-panel', widthIn: 30, heightIn: 76, thickness: '1/2"', finish: 'matte-black' },
  { id: 'pivot-spa', name: 'Pivot Spa Door', blurb: 'Heavy 1/2" pivot door, walk-in / spa', doorType: 'pivot', style: 'single-door', widthIn: 34, heightIn: 78, thickness: '1/2"', finish: 'matte-black' },
  { id: 'neo-angle', name: 'Neo-Angle Corner', blurb: 'Five-sided angled corner enclosure', doorType: 'hinged', style: 'neo-angle', widthIn: 30, heightIn: 76, thickness: '3/8"', finish: 'brushed-nickel' },
  { id: 'serenity-bypass', name: 'Serenity-Style Bypass Slider', blurb: 'Two bypassing sliding panels', doorType: 'bypass', style: 'sliding-bypass', widthIn: 60, heightIn: 76, thickness: '3/8"', finish: 'brushed-nickel' },
  { id: 'crescent-single-slider', name: 'Crescent-Style Single Slider', blurb: 'One sliding panel bypassing one fixed', doorType: 'single-slider', style: 'sliding-bypass', widthIn: 56, heightIn: 72, thickness: '3/8"', finish: 'chrome' },
  { id: 'barn-slider', name: 'Barn-Style Slider', blurb: 'Top-hung roller on an exposed track', doorType: 'barn', style: 'sliding-bypass', widthIn: 60, heightIn: 78, thickness: '3/8"', finish: 'matte-black' },
  { id: 'tub-slider', name: 'Tub Slider', blurb: 'Bypass doors over a bathtub', doorType: 'tub-slider', style: 'sliding-bypass', widthIn: 60, heightIn: 58, thickness: '3/8"', finish: 'chrome' },
];

// ---- Hardware layout: dealer-adjustable holes, hinges & clamps (additive) ----
// Every enclosure can carry an optional hardware layout. When absent, the shop
// order simply omits hole positions (old estimates are unaffected). When present
// with useStandard=true, positions are auto-placed from HW_STD; turning that off
// lets the dealer drag each hole/clamp to an exact measured position.
export type HardwareKind = 'hinge' | 'handle' | 'clamp' | 'towel-bar' | 'hole';

export interface HardwarePlacement {
  id: string;
  kind: HardwareKind;
  label: string;
  panel: OpeningKind;    // which lite kind it sits on
  panelIndex?: number;   // which lite (left-to-right) — for the diagram
  fromTopIn: number;     // vertical center, from the top edge of the glass
  fromEdgeIn: number;    // horizontal center, from the near vertical edge
  diaIn?: number;        // hole diameter (holes / handles)
}

export interface HardwareLayout {
  enabled: boolean;         // show hardware layout for this enclosure
  useStandard: boolean;     // auto-place from HW_STD (off = fully custom)
  handleCtcIn: number;      // back-to-back handle center-to-center
  handleHeightIn: number;   // handle center height from the floor
  clampsPerJoint: number;   // clamps per fixed-panel edge (2 or 3)
  placements: HardwarePlacement[]; // edited/custom placements
}

export const DEFAULT_HARDWARE: HardwareLayout = {
  enabled: true, useStandard: true, handleCtcIn: 6, handleHeightIn: 40, clampsPerJoint: 2, placements: [],
};

// Standard frameless placement rules (inches) — editable defaults per shop,
// matching common CRL install guidance.
export const HW_STD = {
  hingeInsetFromEndIn: 8,      // hinge center this far from top & bottom of the door
  tallDoorIn: 74,             // >= this height (or 1/2" glass) => add a center hinge
  clampInsetFromEndIn: 8,     // side-panel clamp center this far from each end
  handleFromLatchEdgeIn: 2.5, // handle center this far in from the latch/strike edge
  holeDiaIn: 0.5,             // standard back-to-back knob hole diameter
};

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
