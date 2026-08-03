/** Shower Glass Estimation — type definitions */

// ── Shower Styles ────────────────────────────────────

export type ShowerStyleId =
  | "bypass"
  | "hinged-panel"
  | "neo-angle"
  | "return-panel"
  | "fixed-panel"
  | "steam"
  | "semi-frameless";

export interface ShowerStyle {
  id: ShowerStyleId;
  label: string;
  description: string;
  /** Min/max width in inches for this style */
  widthRange: { min: number; max: number };
  /** Standard widths offered (inches) */
  standardWidths: number[];
  /** Standard height in inches */
  standardHeight: number;
  /** Whether this style has a door */
  hasDoor: boolean;
  /** Number of glass panels */
  panelCount: number;
}

// ── Glass ────────────────────────────────────────────

export type GlassThickness = "3/8" | "1/2";

export type GlassType =
  | "clear"
  | "low-iron"
  | "frosted"
  | "rain"
  | "tinted-bronze"
  | "tinted-gray";

export interface GlassOption {
  id: GlassType;
  label: string;
  description: string;
  /** Price multiplier relative to clear glass */
  priceMultiplier: number;
}

export interface GlassThicknessOption {
  id: GlassThickness;
  label: string;
  mmEquivalent: string;
  /** Base price per sq ft for clear glass at this thickness */
  basePricePerSqFt: number;
}

// ── Hardware Finishes ────────────────────────────────

export type HardwareFinish =
  | "chrome"
  | "brushed-nickel"
  | "matte-black"
  | "oil-rubbed-bronze"
  | "polished-brass";

export interface HardwareFinishOption {
  id: HardwareFinish;
  label: string;
  hex: string;
  priceMultiplier: number;
}

// ── Hardware Components ──────────────────────────────

export type CutoutType = "hinge" | "clamp" | "handle" | "valve" | "outlet" | "notch";

export interface CutoutPosition {
  id: string;
  type: CutoutType;
  label: string;
  /** Position from top of glass in inches */
  fromTop: number;
  /** Position from left/right edge in inches */
  fromEdge: number;
  /** Side of the panel */
  side: "left" | "right" | "center";
  /** Diameter/size in inches */
  size: number;
}

export interface HardwareItem {
  id: string;
  type: "clamp" | "hinge" | "handle" | "bracket" | "towel-bar" | "header" | "sill";
  label: string;
  /** Base price per unit in cents */
  basePriceCents: number;
  /** Standard cutout positions associated with this hardware */
  cutoutTemplate: CutoutPosition[];
  /** Quantity typically needed */
  defaultQty: number;
}

// ── Door Configuration ───────────────────────────────

export type SwingDirection = "left" | "right";
export type SlideDirection = "left" | "right";

export interface DoorConfig {
  enabled: boolean;
  /** Swing door */
  swingDirection?: SwingDirection;
  /** Sliding door (bypass style) */
  slideDirection?: SlideDirection;
  width: number;  // inches
  height: number; // inches
}

// ── Complete Shower Estimate ─────────────────────────

export interface ShowerEstimateInput {
  styleId: ShowerStyleId;
  /** Wall-to-wall opening width in inches */
  width: number;
  /** Height in inches (defaults to standard) */
  height: number;
  glassThickness: GlassThickness;
  glassType: GlassType;
  hardwareFinish: HardwareFinish;
  doorConfig: DoorConfig;
  /** Custom cutouts beyond standard hardware templates */
  extraCutouts: CutoutPosition[];
  /** Selected hardware overrides */
  hardwareIds: string[];
}

export interface ShowerPricingLine {
  label: string;
  detail: string;
  amountCents: number;
}

export interface ShowerEstimate {
  input: ShowerEstimateInput;
  /** Glass area in sq ft */
  glassSqFt: number;
  /** Itemized pricing lines */
  lines: ShowerPricingLine[];
  /** Total in cents */
  totalCents: number;
  /** Total formatted */
  totalFormatted: string;
  /** Standard cutout layout for the selected style */
  cutoutLayout: CutoutPosition[];
}
