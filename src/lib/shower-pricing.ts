/** Shower Glass Pricing Engine */
import { formatCurrency } from "@/lib/utils";
import type {
  ShowerEstimateInput,
  ShowerEstimate,
  ShowerPricingLine,
  CutoutPosition,
} from "@/types/shower";
import {
  SHOWER_STYLES,
  GLASS_THICKNESSES,
  GLASS_TYPES,
  HARDWARE_FINISHES,
  HARDWARE_ITEMS,
} from "./shower-data";

// ── Lookup helpers (data is stored as arrays) ─────────

function getStyle(id: string) {
  const s = SHOWER_STYLES.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown shower style: ${id}`);
  return s;
}
function getThickness(id: string) {
  const t = GLASS_THICKNESSES.find((t) => t.id === id);
  if (!t) throw new Error(`Unknown glass thickness: ${id}`);
  return t;
}
function getGlassType(id: string) {
  const g = GLASS_TYPES.find((g) => g.id === id);
  if (!g) throw new Error(`Unknown glass type: ${id}`);
  return g;
}
function getFinish(id: string) {
  const f = HARDWARE_FINISHES.find((f) => f.id === id);
  if (!f) throw new Error(`Unknown hardware finish: ${id}`);
  return f;
}
function getHardware(id: string) {
  const h = HARDWARE_ITEMS.find((h) => h.id === id);
  return h;
}

// ── Constants ─────────────────────────────────────────

const LABOR_RATE_PER_PANEL_CENTS = 8500;   // $85 per panel labor
const FABRICATION_BASE_CENTS = 4500;        // $45 base fabrication
const CUTOUT_COST_PER_CENTS = 1200;         // $12 per cutout
const WASTE_FACTOR = 0.15;                  // 15% glass waste
const MARKUP_MARGIN = 0.35;                 // 35% markup

// ── Calculate ─────────────────────────────────────────

export function calculateShowerEstimate(
  input: ShowerEstimateInput
): ShowerEstimate {
  const style = getStyle(input.styleId);
  const thickness = getThickness(input.glassThickness);
  const glassType = getGlassType(input.glassType);
  const finish = getFinish(input.hardwareFinish);
  const lines: ShowerPricingLine[] = [];

  // ── 1. Glass area ──────────────────────────────────
  const panelAreaSqFt = (input.width * input.height) / 144;
  const totalGlassSqFt = panelAreaSqFt * style.panelCount;
  const glassWithWaste = totalGlassSqFt * (1 + WASTE_FACTOR);

  const glassCostPerSqFt = thickness.basePricePerSqFt * glassType.priceMultiplier;
  const rawGlassCost = glassWithWaste * glassCostPerSqFt;
  const glassCostCents = Math.round(rawGlassCost * 100);

  lines.push({
    label: `${thickness.label} ${glassType.label} Glass`,
    detail: `${totalGlassSqFt.toFixed(1)} sq ft × $${glassCostPerSqFt.toFixed(2)}/sq ft (+${(WASTE_FACTOR * 100).toFixed(0)}% waste)`,
    amountCents: glassCostCents,
  });

  // ── 2. Fabrication ─────────────────────────────────
  const fabCents = FABRICATION_BASE_CENTS + (style.panelCount - 1) * 2500;
  lines.push({
    label: "Fabrication",
    detail: `${style.panelCount} panel${style.panelCount > 1 ? "s" : ""} — polish, edgework, tempering`,
    amountCents: fabCents,
  });

  // ── 3. Hardware ────────────────────────────────────
  const hardwareIds = input.hardwareIds.length > 0
    ? input.hardwareIds
    : getDefaultHardwareIds(input.styleId);

  const selectedHardware = hardwareIds
    .map((id) => getHardware(id))
    .filter((h): h is NonNullable<typeof h> => h !== undefined);

  // ── 4. Cutouts (from hardware templates + extras) ──
  let totalCutoutCount = 0;
  const cutoutLayout: CutoutPosition[] = [];

  for (const hw of selectedHardware) {
    for (const ct of hw.cutoutTemplate) {
      cutoutLayout.push({
        ...ct,
        id: `${hw.id}-${ct.type}-${cutoutLayout.length}`,
      });
    }
    totalCutoutCount += hw.cutoutTemplate.length * hw.defaultQty;
  }

  for (const ec of input.extraCutouts) {
    cutoutLayout.push(ec);
    totalCutoutCount++;
  }

  if (totalCutoutCount > 0) {
    const cutoutCostCents = totalCutoutCount * CUTOUT_COST_PER_CENTS;
    lines.push({
      label: "Cutouts & Notches",
      detail: `${totalCutoutCount} cutout${totalCutoutCount > 1 ? "s" : ""} — hinge prep, clamp holes, valve openings`,
      amountCents: cutoutCostCents,
    });
  }

  // ── 5. Hardware pricing ────────────────────────────
  if (selectedHardware.length > 0) {
    for (const hw of selectedHardware) {
      const hwPrice = Math.round(hw.basePriceCents * finish.priceMultiplier);
      const lineTotal = hwPrice * hw.defaultQty;
      lines.push({
        label: hw.label,
        detail: `${hw.defaultQty}× ${finish.label} finish`,
        amountCents: lineTotal,
      });
    }
  } else {
    const basicPkgCents = 12500; // $125 basic hardware package
    lines.push({
      label: "Basic Hardware Package",
      detail: `Clamps + hinges in ${finish.label} finish`,
      amountCents: basicPkgCents,
    });
  }

  // ── 6. Labor ───────────────────────────────────────
  const laborCents = LABOR_RATE_PER_PANEL_CENTS * style.panelCount;
  lines.push({
    label: "Installation Labor",
    detail: `${style.panelCount} panel${style.panelCount > 1 ? "s" : ""} — measure, fabricate, install`,
    amountCents: laborCents,
  });

  // ── 7. Markup ──────────────────────────────────────
  const subtotalCents = lines.reduce((sum, l) => sum + l.amountCents, 0);
  const markupCents = Math.round(subtotalCents * MARKUP_MARGIN);
  lines.push({
    label: "Shop Markup",
    detail: `${(MARKUP_MARGIN * 100).toFixed(0)}% — overhead, warranty, profit`,
    amountCents: markupCents,
  });

  // ── Total ──────────────────────────────────────────
  const totalCents = lines.reduce((sum, l) => sum + l.amountCents, 0);

  return {
    input,
    glassSqFt: totalGlassSqFt,
    lines,
    totalCents,
    totalFormatted: formatCurrency(totalCents),
    cutoutLayout,
  };
}

// ── Helpers ───────────────────────────────────────────

function getDefaultHardwareIds(styleId: string): string[] {
  switch (styleId) {
    case "bypass":
      return ["clamp-glass-wall", "handle-bar"];
    case "hinged-panel":
      return ["hinge-wall", "clamp-glass-wall", "handle-bar", "support-bracket"];
    case "neo-angle":
      return ["hinge-wall", "clamp-glass-glass", "handle-knob", "support-bracket"];
    case "return-panel":
      return ["hinge-wall", "clamp-glass-wall", "clamp-glass-glass", "handle-bar"];
    case "fixed-panel":
      return ["support-bracket", "clamp-glass-wall"];
    case "steam":
      return ["hinge-wall", "clamp-glass-wall", "handle-bar", "support-bracket", "header"];
    case "semi-frameless":
      return ["header", "sill", "handle-bar"];
    default:
      return [];
  }
}
