import type { EnclosureConfig, RateTable, EnclosureEstimate, LineItem, ProjectEstimate, ShowerStyle } from './types';
import { DEFAULT_SHOWER_RATES } from './rates';

const STYLE_HARDWARE: Record<ShowerStyle, { hinges: number; handles: number; connectors: number; sliding: boolean }> = {
  'single-door':       { hinges: 2, handles: 1, connectors: 0, sliding: false },
  'door-inline-panel': { hinges: 2, handles: 1, connectors: 1, sliding: false },
  'corner-return':     { hinges: 2, handles: 1, connectors: 1, sliding: false },
  'inline-3-panel':    { hinges: 2, handles: 1, connectors: 2, sliding: false },
  'neo-angle':         { hinges: 2, handles: 1, connectors: 2, sliding: false },
  'sliding-bypass':    { hinges: 0, handles: 2, connectors: 0, sliding: true },
};

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function enclosureSqft(c: EnclosureConfig): number {
  const totalWidth = (c.widthsIn || []).reduce((s, w) => s + (w || 0), 0);
  const factor = c.style === 'sliding-bypass' ? 1.05 : 1;
  return round2((totalWidth * (c.heightIn || 0) * factor) / 144);
}

export function priceEnclosure(c: EnclosureConfig, rates: RateTable = DEFAULT_SHOWER_RATES): EnclosureEstimate {
  const items: LineItem[] = [];
  const push = (label: string, qty: number, rate: number) => {
    if (qty > 0 && rate > 0) items.push({ label, qty: round2(qty), rate, amount: round2(qty * rate) });
  };
  const sqft = enclosureSqft(c);
  const hw = STYLE_HARDWARE[c.style];
  const upcharge = 1 + (rates.finishUpchargePct[c.finish] || 0) / 100;

  const glassRate = rates.glassPerSqft[c.thickness]?.[c.glass] || 0;
  push(`Glass - ${c.thickness} ${c.glass} (${sqft} sq ft)`, sqft, glassRate);

  push('Hinges / pivots', hw.hinges, round2(rates.hardware.hinge * upcharge));
  push('Handles / pulls', hw.handles + (c.extraHandles || 0), round2(rates.hardware.handle * upcharge));
  push('Glass-to-glass connectors', hw.connectors, round2(rates.hardware.connector * upcharge));
  if (hw.sliding) {
    push('Sliding track + rollers', 1, round2(rates.hardware.slidingKit * upcharge));
    const widthFt = (c.widthsIn?.[0] || 0) / 12;
    push('Header / channel', widthFt, rates.hardware.headerPerFt);
  }

  push('Handle / accessory holes', c.cutouts?.handleHoles || 0, rates.fabrication.handleHole);
  push('Hinge cutouts', c.cutouts?.hingeCutouts || 0, rates.fabrication.hingeCutout);
  push('Corner / knee-wall notches', c.cutouts?.notches || 0, rates.fabrication.notch);

  const bars = c.cutouts?.towelBars || 0;
  push('Towel bars', bars, round2(rates.hardware.towelBar * upcharge));
  push('Towel bar holes', bars * 2, rates.fabrication.handleHole);

  push('Installation labor', 1, round2(rates.labor.installBase + sqft * rates.labor.installPerSqft));

  const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
  return { config: c, sqft, lineItems: items, subtotal };
}

export function priceProject(configs: EnclosureConfig[], rates: RateTable = DEFAULT_SHOWER_RATES): ProjectEstimate {
  const enclosures = configs.map((c) => priceEnclosure(c, rates));
  const subtotal = round2(enclosures.reduce((s, e) => s + e.subtotal, 0));
  return { enclosures, subtotal };
}
