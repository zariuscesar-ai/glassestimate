// Top-down footprint (plan) of a shower enclosure — walls, wall lengths, and the
// door swing. Most useful for 90 corner and neo-angle jobs. Pure SVG.

import type { EnclosureConfig, Finish } from '@/lib/shower/types';
import { planWalls, formatIn, type Pt } from '@/lib/shower/glass';

const FINISH_COLOR: Record<Finish, string> = {
  chrome: '#8b939c', 'brushed-nickel': '#8f887e', 'matte-black': '#26292d',
  'oil-rubbed-bronze': '#4a3b2e', brass: '#a98a2f',
};

export default function ShowerPlan({ cfg }: { cfg: EnclosureConfig }) {
  const { segs, minX, maxX, minY, maxY } = planWalls(cfg);
  if (!segs.length) return null;
  const finish = FINISH_COLOR[cfg.finish] || '#8b939c';
  const wall = '#0f766e';
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const span = Math.max(w, h);
  const pad = Math.max(10, span * 0.24);
  const vb = `${minX - pad} ${minY - pad} ${w + 2 * pad} ${h + 2 * pad}`;
  const f = Math.max(2.4, span * 0.055);

  const eps = segs.flatMap((s) => [s.a, s.b]);
  const cen: Pt = { x: eps.reduce((s, p) => s + p.x, 0) / eps.length, y: eps.reduce((s, p) => s + p.y, 0) / eps.length };
  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const arcPath = (c: Pt, r: number, s: number, e: number) => {
    const steps = 18, delta = Math.atan2(Math.sin(e - s), Math.cos(e - s));
    let d = `M ${c.x + Math.cos(s) * r} ${c.y + Math.sin(s) * r}`;
    for (let k = 1; k <= steps; k++) { const a = s + (delta * k) / steps; d += ` L ${c.x + Math.cos(a) * r} ${c.y + Math.sin(a) * r}`; }
    return d;
  };

  return (
    <svg viewBox={vb} width="100%" style={{ display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img" aria-label="Shower plan view">
      <text x={minX - pad * 0.6} y={minY - pad * 0.45} fontSize={f * 0.85} fill="#7f90ad" fontWeight={600}>PLAN · top-down</text>
      {segs.map((s, i) => {
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        let nx = -uy, ny = ux; const m = mid(s.a, s.b);
        if ((cen.x - m.x) * nx + (cen.y - m.y) * ny > 0) { nx = -nx; ny = -ny; } // point label away from interior
        return (
          <g key={i}>
            {s.door && (() => {
              let inx = -uy, iny = ux; // interior normal (toward centroid)
              if ((cen.x - s.a.x) * inx + (cen.y - s.a.y) * iny < 0) { inx = -inx; iny = -iny; }
              const r = s.nomLen, start = Math.atan2(uy, ux), end = Math.atan2(iny, inx);
              return (
                <g>
                  <path d={arcPath(s.a, r, start, end)} fill="none" stroke={finish} strokeWidth={1.2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                  <line x1={s.a.x} y1={s.a.y} x2={s.a.x + inx * r} y2={s.a.y + iny * r} stroke={finish} strokeWidth={1.4} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })()}
            <line x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={s.door ? finish : wall} strokeWidth={s.door ? 2.6 : 3.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <text x={m.x + nx * f * 1.5} y={m.y + ny * f * 1.5} textAnchor="middle" dominantBaseline="middle" fontSize={f} fill="#334155" fontWeight={600}>{formatIn(s.nomLen)}</text>
          </g>
        );
      })}
      {segs.map((s, i) => (
        <circle key={'p' + i} cx={s.a.x} cy={s.a.y} r={Math.max(1.2, f * 0.3)} fill="#0e1828" stroke="#93a4c2" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
