import type { EnclosureConfig, RateTable, EnclosureEstimate, LineItem, ProjectEstimate, ShowerStyle } from './types';
import { HANDLE_TYPES, TOWEL_BAR_TYPES } from './types';
import { DEFAULT_SHOWER_RATES } from './rates';
import { layoutEnclosure, resolveHardware, isSlidingDoor } from './glass';

const STYLE_HARDWARE: Record<ShowerStyle, { hinges: number; handles: number; connectors: number; sliding: boolean }> = {
  'single-door':       { hinges: 2, handles: 1, connectors: 0, sliding: false },
  'door-inline-panel': { hinges: 2, handles: 1, connectors: 1, sliding: false },
  'corner-return':     { hinges: 2, handles: 1, connectors: 1, sliding: false },
  'inline-3-panel':    { hinges: 2, handles: 1, connectors: 2, sliding: false },
  'neo-angle':         { hinges: 2, handles: 1, connectors: 2, sliding: false },
  'sliding-bypass':    { hinges: 0, handles: 2, connectors: 0, sliding: true },
};

// Relative cost of each handle/pull type vs the base handle rate. A knob is
// cheaper than a base pull; ladder pulls and towel-bar combos cost more. Applied
// on top of the shop's editable base rate, so shops can still tune the baseline.
const HANDLE_FACTOR: Record<string, number> = {
  knob: 0.6, 'btb-knob': 0.9, 'pull-6': 1, 'pull-8': 1.1, 'pull-12': 1.3,
  'ladder-18': 1.6, 'ladder-24': 1.9, 'combo-18': 1.85, 'combo-24': 2.15,
};

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function enclosureSqft(c: EnclosureConfig): number {
  const totalWidth = (c.widthsIn || []).reduce((s, w) => s + (w || 0), 0);
  const factor = c.style === 'sliding-bypass' ? 1.05 : 1;
  return round2((totalWidth * (c.heightIn || 0) * factor) / 144);
}

// Extra glass square footage from a pony/knee wall: the 90° return that sits on
// the knee wall plus the notched (custom-cut) panel beside the door.
export function ponySqft(c: EnclosureConfig): number {
  const pony = c.ponyWall;
  if (!pony) return 0;
  const encH = c.heightIn || 76;
  let a = 0;
  if (pony.hasReturn) a += (pony.returnWidthIn * Math.max(0, encH - pony.heightIn)) / 144;
  if (pony.notched) a += ((pony.panelWidthIn ?? 24) * (pony.panelHeightIn ?? encH)) / 144;
  return round2(a);
}

export function priceEnclosure(c: EnclosureConfig, rates: RateTable = DEFAULT_SHOWER_RATES): EnclosureEstimate {
  const items: LineItem[] = [];
  const push = (label: string, qty: number, rate: number) => {
    if (qty > 0 && rate > 0) items.push({ label, qty: round2(qty), rate, amount: round2(qty * rate) });
  };
  const sqft = enclosureSqft(c);
  const psq = ponySqft(c);
  const hw = STYLE_HARDWARE[c.style];
  const upcharge = 1 + (rates.finishUpchargePct[c.finish] || 0) / 100;
  // A sliding *door type* on any style is priced as a slider (kit + track, no hinges).
  const isSliding = hw.sliding || isSlidingDoor(c.doorType);

  const glassRate = rates.glassPerSqft[c.thickness]?.[c.glass] || 0;
  push(`Glass - ${c.thickness} ${c.glass} (${sqft} sq ft)`, sqft, glassRate);
  push('Pony-wall glass (return + notched panel)', psq, glassRate);

  push('Hinges / pivots', isSliding ? 0 : hw.hinges, round2(rates.hardware.hinge * upcharge));

  // Handle price scales with the selected type (knob → ladder → combo).
  const handleFactor = c.handleType ? (HANDLE_FACTOR[c.handleType] ?? 1) : 1;
  const handleName = HANDLE_TYPES.find((h) => h.id === c.handleType)?.name;
  push(handleName ? `Handles / pulls — ${handleName}` : 'Handles / pulls',
    hw.handles + (c.extraHandles || 0), round2(rates.hardware.handle * upcharge * handleFactor));

  // Glass-to-glass clamps: from the actual hardware layout when enabled, else the
  // style's connector count. Plus 2 clamps per pony-wall piece.
  const layoutClamps = c.hardware?.enabled ? resolveHardware(c).filter((p) => p.kind === 'clamp').length : hw.connectors;
  const ponyClamps = c.ponyWall ? ((c.ponyWall.hasReturn ? 2 : 0) + (c.ponyWall.notched ? 2 : 0)) : 0;
  push('Glass-to-glass clamps / connectors', layoutClamps + ponyClamps, round2(rates.hardware.connector * upcharge));

  if (isSliding) {
    push('Sliding track + rollers', 1, round2(rates.hardware.slidingKit * upcharge));
    // Header/track by the real track length (barn's exposed rail runs past the opening).
    const track = layoutEnclosure(c).track;
    const widthFt = (track ? track.x2 - track.x1 : (c.widthsIn?.[0] || 0)) / 12;
    push('Header / track', round2(widthFt), rates.hardware.headerPerFt);
  }

  push('Handle / accessory holes', c.cutouts?.handleHoles || 0, rates.fabrication.handleHole);
  push('Hinge cutouts', c.cutouts?.hingeCutouts || 0, rates.fabrication.hingeCutout);
  // Manual notches + the notched pony panel (custom cut).
  const notchCount = (c.cutouts?.notches || 0) + (c.ponyWall?.notched ? 1 : 0);
  push('Corner / knee-wall notches', notchCount, rates.fabrication.notch);

  // Towel bar price scales with length (18 / 24 / 30").
  const tb = TOWEL_BAR_TYPES.find((t) => t.id === c.towelBarType);
  const bars = c.cutouts?.towelBars || 0;
  const tbFactor = tb && tb.lengthIn ? tb.lengthIn / 18 : 1;
  push(tb && tb.id !== 'none' ? `Towel bars — ${tb.name}` : 'Towel bars', bars, round2(rates.hardware.towelBar * upcharge * tbFactor));
  push('Towel bar holes', bars * 2, rates.fabrication.handleHole);

  // Labor scales with the total glass installed (main + pony).
  push('Installation labor', 1, round2(rates.labor.installBase + (sqft + psq) * rates.labor.installPerSqft));

  const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
  return { config: c, sqft, lineItems: items, subtotal };
}

export function priceProject(configs: EnclosureConfig[], rates: RateTable = DEFAULT_SHOWER_RATES): ProjectEstimate {
  const enclosures = configs.map((c) => priceEnclosure(c, rates));
  const subtotal = round2(enclosures.reduce((s, e) => s + e.subtotal, 0));
  return { enclosures, subtotal };
}
