/**
 * Shower Glass Industry Data
 *
 * Standard dimensions, hardware, cutout positions, and pricing constants
 * sourced from CRL, Frameless Hardware Company (FHC), and industry norms.
 */

import type {
  ShowerStyle,
  GlassOption,
  GlassThicknessOption,
  HardwareFinishOption,
  HardwareItem,
  CutoutPosition,
} from "@/types/shower";

// ── Shower Styles ────────────────────────────────────

export const SHOWER_STYLES: ShowerStyle[] = [
  {
    id: "bypass",
    label: "Bypass (Sliding) Door",
    description: "Two-panel sliding door on a track. Most common for tub and shower openings.",
    widthRange: { min: 48, max: 72 },
    standardWidths: [48, 54, 60, 66, 72],
    standardHeight: 72,
    hasDoor: true,
    panelCount: 2,
  },
  {
    id: "hinged-panel",
    label: "Hinged Door + Inline Panel",
    description: "Single swing door with a fixed inline panel. Classic frameless look.",
    widthRange: { min: 44, max: 72 },
    standardWidths: [48, 54, 60, 66, 72],
    standardHeight: 72,
    hasDoor: true,
    panelCount: 2,
  },
  {
    id: "neo-angle",
    label: "Neo-Angle Enclosure",
    description: "Three-panel corner enclosure with a center door. Perfect for corner showers.",
    widthRange: { min: 36, max: 48 },
    standardWidths: [36, 38, 40, 42, 48],
    standardHeight: 72,
    hasDoor: true,
    panelCount: 3,
  },
  {
    id: "return-panel",
    label: "Return Panel (L-Shape)",
    description: "Door with a perpendicular return panel wrapping the corner.",
    widthRange: { min: 48, max: 72 },
    standardWidths: [48, 54, 60, 66, 72],
    standardHeight: 72,
    hasDoor: true,
    panelCount: 2,
  },
  {
    id: "fixed-panel",
    label: "Fixed Panel (Walk-In)",
    description: "Single fixed glass panel — no door. Modern walk-in style.",
    widthRange: { min: 30, max: 60 },
    standardWidths: [30, 36, 42, 48, 54, 60],
    standardHeight: 76,
    hasDoor: false,
    panelCount: 1,
  },
  {
    id: "steam",
    label: "Steam Shower Enclosure",
    description: "Full floor-to-ceiling enclosure with transom. Sealed for steam.",
    widthRange: { min: 48, max: 72 },
    standardWidths: [48, 54, 60, 66, 72],
    standardHeight: 84,
    hasDoor: true,
    panelCount: 3, // door + panel + transom
  },
  {
    id: "semi-frameless",
    label: "Semi-Frameless",
    description: "Framed header and sill with frameless glass panels. Budget-friendly option.",
    widthRange: { min: 48, max: 60 },
    standardWidths: [48, 54, 60],
    standardHeight: 72,
    hasDoor: true,
    panelCount: 2,
  },
];

// ── Glass Options ────────────────────────────────────

export const GLASS_THICKNESSES: GlassThicknessOption[] = [
  {
    id: "3/8",
    label: '3/8" (10mm)',
    mmEquivalent: "10mm",
    basePricePerSqFt: 18, // $18/sq ft installed base
  },
  {
    id: "1/2",
    label: '1/2" (12mm)',
    mmEquivalent: "12mm",
    basePricePerSqFt: 24, // $24/sq ft installed base
  },
];

export const GLASS_TYPES: GlassOption[] = [
  {
    id: "clear",
    label: "Clear Glass",
    description: "Standard clear float glass. Most economical.",
    priceMultiplier: 1.0,
  },
  {
    id: "low-iron",
    label: "Low-Iron (Starphire®)",
    description: "Ultra-clear with no green tint. Premium look.",
    priceMultiplier: 1.4,
  },
  {
    id: "frosted",
    label: "Frosted / Acid-Etched",
    description: "Privacy glass with a satin finish. Obscures view while letting light through.",
    priceMultiplier: 1.5,
  },
  {
    id: "rain",
    label: "Rain / Textured",
    description: "Patterned textured glass. Adds visual interest and privacy.",
    priceMultiplier: 1.35,
  },
  {
    id: "tinted-bronze",
    label: "Tinted Bronze",
    description: "Warm bronze tint. Reduces glare and heat transmission.",
    priceMultiplier: 1.3,
  },
  {
    id: "tinted-gray",
    label: "Tinted Gray",
    description: "Cool gray tint. Modern look with solar control.",
    priceMultiplier: 1.3,
  },
];

// ── Hardware Finishes ────────────────────────────────

export const HARDWARE_FINISHES: HardwareFinishOption[] = [
  { id: "chrome", label: "Chrome", hex: "#C0C0C0", priceMultiplier: 1.0 },
  { id: "brushed-nickel", label: "Brushed Nickel", hex: "#A5A09B", priceMultiplier: 1.2 },
  { id: "matte-black", label: "Matte Black", hex: "#1A1A1A", priceMultiplier: 1.25 },
  { id: "oil-rubbed-bronze", label: "Oil-Rubbed Bronze", hex: "#4A3728", priceMultiplier: 1.35 },
  { id: "polished-brass", label: "Polished Brass", hex: "#C5A54A", priceMultiplier: 1.4 },
];

// ── Hardware Items ───────────────────────────────────

export const HARDWARE_ITEMS: HardwareItem[] = [
  // Hinges
  {
    id: "hinge-wall",
    type: "hinge",
    label: "Wall-Mount Hinge",
    basePriceCents: 4500, // $45 each
    cutoutTemplate: [
      { id: "hinge-top", type: "hinge", label: "Top Hinge Cutout", fromTop: 6, fromEdge: 2, side: "left", size: 1.5 },
      { id: "hinge-bottom", type: "hinge", label: "Bottom Hinge Cutout", fromTop: 66, fromEdge: 2, side: "left", size: 1.5 },
    ],
    defaultQty: 2,
  },
  {
    id: "hinge-glass",
    type: "hinge",
    label: "Glass-to-Glass Hinge",
    basePriceCents: 5500, // $55 each
    cutoutTemplate: [
      { id: "ggh-top", type: "hinge", label: "Top Glass Hinge Cutout", fromTop: 6, fromEdge: 2, side: "right", size: 1.5 },
      { id: "ggh-bottom", type: "hinge", label: "Bottom Glass Hinge Cutout", fromTop: 66, fromEdge: 2, side: "right", size: 1.5 },
    ],
    defaultQty: 2,
  },
  // Clamps
  {
    id: "clamp-glass-wall",
    type: "clamp",
    label: "Glass-to-Wall Clamp",
    basePriceCents: 2800, // $28 each
    cutoutTemplate: [
      { id: "cw-top", type: "clamp", label: "Top Wall Clamp Cutout", fromTop: 2, fromEdge: 2, side: "left", size: 1.0 },
      { id: "cw-bottom", type: "clamp", label: "Bottom Wall Clamp Cutout", fromTop: 70, fromEdge: 2, side: "left", size: 1.0 },
    ],
    defaultQty: 2,
  },
  {
    id: "clamp-glass-glass",
    type: "clamp",
    label: "Glass-to-Glass Clamp",
    basePriceCents: 3200, // $32 each
    cutoutTemplate: [
      { id: "cg-top", type: "clamp", label: "Top Glass Clamp Cutout", fromTop: 2, fromEdge: 2, side: "right", size: 1.0 },
      { id: "cg-bottom", type: "clamp", label: "Bottom Glass Clamp Cutout", fromTop: 70, fromEdge: 2, side: "right", size: 1.0 },
    ],
    defaultQty: 2,
  },
  // Handles
  {
    id: "handle-bar",
    type: "handle",
    label: "Bar Pull Handle",
    basePriceCents: 6500, // $65 each
    cutoutTemplate: [
      { id: "handle-center", type: "handle", label: "Handle Cutout", fromTop: 36, fromEdge: 2.375, side: "center", size: 0.5 },
    ],
    defaultQty: 1,
  },
  {
    id: "handle-knob",
    type: "handle",
    label: "Knob (Back-to-Back)",
    basePriceCents: 4500, // $45 each
    cutoutTemplate: [
      { id: "knob-center", type: "handle", label: "Knob Cutout", fromTop: 36, fromEdge: 2.375, side: "center", size: 0.375 },
    ],
    defaultQty: 1,
  },
  {
    id: "handle-towel-bar",
    type: "towel-bar",
    label: "Towel Bar Handle",
    basePriceCents: 8500, // $85 each
    cutoutTemplate: [
      { id: "towel-top", type: "handle", label: "Upper Towel Bar Cutout", fromTop: 30, fromEdge: 2.375, side: "center", size: 0.5 },
      { id: "towel-bottom", type: "handle", label: "Lower Towel Bar Cutout", fromTop: 42, fromEdge: 2.375, side: "center", size: 0.5 },
    ],
    defaultQty: 1,
  },
  // Brackets & support
  {
    id: "support-bracket",
    type: "bracket",
    label: "Support Bracket (per panel)",
    basePriceCents: 2200, // $22 each
    cutoutTemplate: [],
    defaultQty: 1,
  },
  {
    id: "header",
    type: "header",
    label: "Header / Transom Bar",
    basePriceCents: 9500, // $95 each
    cutoutTemplate: [],
    defaultQty: 0,
  },
  {
    id: "sill",
    type: "sill",
    label: "Bottom Sill Track",
    basePriceCents: 7500, // $75 each
    cutoutTemplate: [],
    defaultQty: 0,
  },
];

// ── Standard Valve & Outlet Cutout Positions ─────────

/** Standard shower valve height from floor (inches) */
export const VALVE_HEIGHT = 48;

/** Standard shower outlet height from floor (inches) */
export const OUTLET_HEIGHT = 24;

/** Standard notch/knee wall cutout positions */
export const STANDARD_EXTRA_CUTOUTS: CutoutPosition[] = [
  {
    id: "valve-hole",
    type: "valve",
    label: "Shower Valve Cutout",
    fromTop: 24, // 72" - 48" = 24" from top
    fromEdge: 6,
    side: "center",
    size: 4.5, // 4.5" diameter for standard valve
  },
  {
    id: "outlet-hole",
    type: "outlet",
    label: "Shower Outlet Cutout",
    fromTop: 48, // 72" - 24" = 48" from top
    fromEdge: 3,
    side: "center",
    size: 1.5, // 1.5" diameter for standard pipe
  },
];

// ── Pricing Constants ────────────────────────────────

/** Labor rate per sq ft for fabrication & installation (cents) */
export const LABOR_PER_SQFT_CENTS = 1500; // $15/sq ft

/** Flat fabrication surcharge per panel (cents) — edge polish, tempering */
export const FABRICATION_PER_PANEL_CENTS = 3500; // $35/panel

/** Price per cutout/notch (cents) — drilling, notching labor */
export const CUTOUT_PRICE_CENTS = 2500; // $25 per cutout

/** Waste factor (extra glass percentage) */
export const WASTE_FACTOR = 0.15; // 15%

/** Default markup margin */
export const DEFAULT_MARKUP = 0.35; // 35%
