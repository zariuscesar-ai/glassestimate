// Brand-neutral frameless shower hardware reference — the factual specs that
// drive cut-out accuracy, gathered from published manufacturer catalogs and
// install guides (CRL, FHC, PRL, Leader Hardware and others). These are industry
// facts (dimensions, angles, positions), not any one brand's proprietary catalog,
// so the estimator stays accurate no matter which brand the shop buys.

import { HINGE_TYPES, CLAMP_TYPES, HANDLE_HOLE_SIZES, HW_STD } from './types';

export interface RefRow { label: string; spec: string; fab: string; }
export interface RefSection { title: string; blurb: string; rows: RefRow[]; }

// Standard placement rules (inches) restated for the reference card.
const HINGE_INSET = HW_STD.hingeInsetFromEndIn;   // 8" ≈ 150–200 mm from each end
const CLAMP_INSET = HW_STD.clampInsetFromEndIn;   // 8" from each panel end

export const HARDWARE_REFERENCE: RefSection[] = [
  {
    title: 'Hinges',
    blurb: 'Frameless hinges clamp the door edge with gaskets — the door needs a POSITION, not a cutout. Only glass-to-glass hinges notch the fixed panel.',
    rows: HINGE_TYPES.map((h) => ({
      label: h.name,
      spec: `${h.mount} · fits ${h.glass} glass`,
      fab: h.panelFab === 'notch' ? 'Fixed panel: small notch at each hinge' : 'No glass cutout',
    })).concat([
      { label: 'Hinge positions', spec: `Top & bottom hinge ≈ ${HINGE_INSET}" (150–200 mm) from each end; 3rd hinge centered on doors ≥ 74" or 1/2" glass`, fab: 'Position only' },
      { label: 'Door swing gap', spec: 'Hinge side ~3/16"; strike side ~3/16" to panel/wall', fab: 'Shop deduction' },
    ]),
  },
  {
    title: 'Glass-to-glass & wall clamps',
    blurb: 'Clamps grip the glass edge — no cutout. Choose the clamp made for the joint angle and the glass thickness.',
    rows: CLAMP_TYPES.map((c) => ({
      label: c.name,
      spec: `${c.angle}° joint · fits ${c.glass} glass`,
      fab: 'No cutout — edge clamp',
    })).concat([
      { label: 'Clamp positions (side panel)', spec: `2 per panel edge (3 on tall panels), ≈ ${CLAMP_INSET}" in from each end`, fab: 'Position only' },
      { label: 'Profiles', spec: 'Square or beveled/traditional (round) — cosmetic, same fit', fab: '—' },
    ]),
  },
  {
    title: 'Sliding systems (barn / bypass / tub)',
    blurb: 'Rollers ride an exposed header/track. Track runs past the opening so the door parks clear. Panels overlap at the bypass.',
    rows: [
      { label: 'Bypass (two sliding)', spec: 'Two panels, ~1" overlap; header spans the opening', fab: 'No cutout' },
      { label: 'Single slider', spec: '1 fixed + 1 bypassing panel; header spans opening', fab: 'No cutout' },
      { label: 'Barn (top-hung)', spec: 'Fixed panel + door on an exposed rail; rail ≈ opening + one door-width so the door parks clear', fab: 'No cutout' },
      { label: 'Tub slider', spec: 'Bypass over a tub, ~56–60" wide × ~58–62" tall', fab: 'No cutout' },
      { label: 'Curb / threshold', spec: '≥ 3" (≥ 4" for 1/2" glass)', fab: '—' },
    ],
  },
  {
    title: 'Door handles & pulls (drilled holes)',
    blurb: 'The one true glass fabrication on a door: back-to-back knobs/pulls need through-holes. Ladder pulls use two holes at the center-to-center.',
    rows: HANDLE_HOLE_SIZES.map((h) => ({
      label: h.label,
      spec: `⌀ ${h.diaIn}" through-hole · fits ${h.glass} glass`,
      fab: 'Drilled hole',
    })).concat([
      { label: 'Handle height', spec: 'Center ~38–40" above finished floor', fab: 'Position' },
      { label: 'Hole from strike edge', spec: `~${HW_STD.handleFromLatchEdgeIn}" in from the latch edge`, fab: 'Position' },
      { label: 'Common CTC', spec: 'Pulls 6" / 8" / 12"; ladder pulls 18" / 24"', fab: 'Position' },
    ]),
  },
  {
    title: 'Glass thickness guide',
    blurb: 'Pick thickness by span/height; hardware above fits both unless noted.',
    rows: [
      { label: '3/8" (10 mm)', spec: 'Residential standard — most doors & panels', fab: '—' },
      { label: '1/2" (12 mm)', spec: 'Panels over ~80" tall, wide fixed spans, walk-in/spa, doors hinged off glass', fab: '—' },
      { label: 'Fixed-panel bracket wall', spec: 'Needs ≥ 5-1/2" of flat wall for clamps', fab: '—' },
    ],
  },
];
