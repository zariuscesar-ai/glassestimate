// To-scale elevation "shop drawing" of a shower enclosure. Renders each glass
// lite to accurate proportion (trapezoids when walls are out of square), with
// finish-colored hardware and field dimensions. Pure SVG so it prints crisply.

import type { EnclosureConfig, GlassType, Finish } from '@/lib/shower/types';
import { layoutEnclosure, formatDim, type Quad, type GlassPanel } from '@/lib/shower/glass';

const GLASS_TINT: Record<GlassType, string> = {
  clear: '#cfe6ea', 'low-iron': '#d8ece9', frosted: '#e6ecee', tinted: '#aeb9bf',
};
const FINISH_COLOR: Record<Finish, string> = {
  chrome: '#aeb6bf', 'brushed-nickel': '#a49e94', 'matte-black': '#26292d',
  'oil-rubbed-bronze': '#4a3b2e', brass: '#b39338',
};

const pts = (q: Quad) => `${q.tl.x},${q.tl.y} ${q.tr.x},${q.tr.y} ${q.br.x},${q.br.y} ${q.bl.x},${q.bl.y}`;
const cen = (q: Quad) => ({ x: (q.tl.x + q.tr.x + q.bl.x + q.br.x) / 4, y: (q.tl.y + q.tr.y + q.bl.y + q.br.y) / 4 });

export default function ShowerDrawing({ cfg }: { cfg: EnclosureConfig }) {
  const { panels, totalW, maxH, track } = layoutEnclosure(cfg);
  if (!panels.length || totalW <= 0 || maxH <= 0) return null;
  const tint = GLASS_TINT[cfg.glass] || '#cfe6ea';
  const finish = FINISH_COLOR[cfg.finish] || '#aeb6bf';

  const padX = Math.max(9, maxH * 0.16), padT = Math.max(7, maxH * 0.10), padB = Math.max(11, maxH * 0.15);
  const rightExtent = Math.max(totalW, track ? track.x2 : 0); // exposed barn track runs past the opening
  const vbW = rightExtent + padX * 2, vbH = maxH + padT + padB;
  const f = Math.max(2.2, maxH * 0.038);        // dimension font (inches)
  const fs = Math.max(1.9, maxH * 0.03);         // small label font

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" style={{ display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img" aria-label="Shower elevation drawing">
      <g transform={`translate(${padX},${padT})`}>
        {/* floor line */}
        <line x1={-padX * 0.5} y1={maxH} x2={totalW + padX * 0.5} y2={maxH} stroke="#94a3b8" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />

        {panels.map((p, i) => {
          const c = cen(p.glassQuad);
          const isDoor = p.kind === 'door';
          const gLeft = Math.min(p.glassQuad.tl.x, p.glassQuad.bl.x);
          const gRight = Math.max(p.glassQuad.tr.x, p.glassQuad.br.x);
          const gTop = Math.min(p.glassQuad.tl.y, p.glassQuad.tr.y);
          const gh = Math.max(p.glassQuad.bl.y, p.glassQuad.br.y) - gTop;
          return (
            <g key={i}>
              {/* rough opening outline */}
              <polygon points={pts(p.openingQuad)} fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              {/* glass */}
              <polygon points={pts(p.glassQuad)} fill={tint} fillOpacity={cfg.glass === 'frosted' ? 0.72 : 0.5} stroke={finish} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              {/* subtle reflection streak */}
              <line x1={gLeft + (gRight - gLeft) * 0.22} y1={gTop} x2={gLeft + (gRight - gLeft) * 0.34} y2={gTop + gh} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} vectorEffect="non-scaling-stroke" />

              {isDoor && (
                <g>
                  {/* hinges on the left jamb */}
                  <rect x={gLeft - 0.6} y={gTop + gh * 0.14} width={1.6} height={gh * 0.09} rx={0.4} fill={finish} />
                  <rect x={gLeft - 0.6} y={gTop + gh * 0.77} width={1.6} height={gh * 0.09} rx={0.4} fill={finish} />
                  {/* handle on the strike side */}
                  <rect x={gRight - 3.2} y={gTop + gh * 0.42} width={1.4} height={gh * 0.16} rx={0.7} fill={finish} />
                </g>
              )}

              {/* sliding lite: handle on the leading edge + slide-direction hint */}
              {p.kind === 'sliding' && p.role === 'sliding' && (
                <g>
                  <rect x={(i % 2 === 0 ? gRight - 2.4 : gLeft + 1.0)} y={gTop + gh * 0.40} width={1.4} height={gh * 0.20} rx={0.7} fill={finish} />
                  <line x1={c.x - 3} y1={gTop + gh * 0.5} x2={c.x + 3} y2={gTop + gh * 0.5} stroke={finish} strokeOpacity={0.55} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
                  <polygon points={`${c.x + 3},${gTop + gh * 0.5} ${c.x + 1.6},${gTop + gh * 0.5 - 1.3} ${c.x + 1.6},${gTop + gh * 0.5 + 1.3}`} fill={finish} fillOpacity={0.55} />
                </g>
              )}

              {/* panel label + ordered size */}
              <text x={c.x} y={c.y - fs * 0.3} textAnchor="middle" fontSize={fs} fill="#0f172a" fontWeight={600}>{p.label}</text>
              <text x={c.x} y={c.y + fs * 1.1} textAnchor="middle" fontSize={fs} fill="#0f766e" fontWeight={700}>
                {p.square ? `${formatDim(p.wTop)} × ${formatDim(p.hLeft)}` : 'out of square'}
              </text>

              {/* top width dimension (field) */}
              <text x={(p.openingQuad.tl.x + p.openingQuad.tr.x) / 2} y={-padT * 0.25} textAnchor="middle" fontSize={f} fill="#334155" fontWeight={600}>
                {formatDim(p.openingQuad.tr.x - p.openingQuad.tl.x)}
              </text>
              {/* bottom width when it differs (out of square) */}
              {Math.abs((p.openingQuad.br.x - p.openingQuad.bl.x) - (p.openingQuad.tr.x - p.openingQuad.tl.x)) > 1 / 16 && (
                <text x={(p.openingQuad.bl.x + p.openingQuad.br.x) / 2} y={maxH + padB * 0.55} textAnchor="middle" fontSize={f} fill="#b45309" fontWeight={600}>
                  {formatDim(p.openingQuad.br.x - p.openingQuad.bl.x)}
                </text>
              )}
            </g>
          );
        })}

        {/* sliding header / exposed roller track */}
        {track && (
          track.exposed ? (
            <g>
              {/* exposed barn rail sits just above the glass and runs past the opening */}
              <rect x={track.x1} y={-Math.max(1.6, maxH * 0.03)} width={track.x2 - track.x1} height={Math.max(1.4, maxH * 0.022)} rx={0.6} fill={finish} />
              <circle cx={track.x1 + (track.x2 - track.x1) * 0.30} cy={-Math.max(1.6, maxH * 0.03) + Math.max(0.7, maxH * 0.011)} r={Math.max(0.8, maxH * 0.012)} fill="#f8fafc" stroke={finish} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              <circle cx={track.x1 + (track.x2 - track.x1) * 0.62} cy={-Math.max(1.6, maxH * 0.03) + Math.max(0.7, maxH * 0.011)} r={Math.max(0.8, maxH * 0.012)} fill="#f8fafc" stroke={finish} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              <text x={(track.x1 + track.x2) / 2} y={-Math.max(1.6, maxH * 0.03) - fs * 0.4} textAnchor="middle" fontSize={fs} fill="#64748b">roller track {formatDim(track.x2 - track.x1)}</text>
            </g>
          ) : (
            <rect x={track.x1} y={0} width={track.x2 - track.x1} height={Math.max(1.0, maxH * 0.016)} rx={0.4} fill={finish} fillOpacity={0.85} />
          )
        )}

        {/* left height dimension */}
        <text x={-padX * 0.45} y={maxH / 2} textAnchor="middle" fontSize={f} fill="#334155" fontWeight={600} transform={`rotate(-90 ${-padX * 0.45} ${maxH / 2})`}>
          H {formatDim(panels[0].openingQuad.bl.y)}
        </text>
      </g>
    </svg>
  );
}

export { GLASS_TINT, FINISH_COLOR };
export type { GlassPanel };
