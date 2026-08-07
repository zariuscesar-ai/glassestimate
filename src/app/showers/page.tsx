"use client";

import { useMemo, useRef, useState } from "react";
import { SHOWER_STYLES, GLASS_TYPES, THICKNESSES, FINISHES } from "@/lib/shower/types";
import type { EnclosureConfig, ShowerStyle, GlassThickness, GlassType, Finish } from "@/lib/shower/types";
import { priceProject } from "@/lib/shower/pricing";

const DEFAULT_WIDTHS: Record<ShowerStyle, number[]> = {
  "single-door": [30],
  "door-inline-panel": [30, 24],
  "corner-return": [36, 30],
  "inline-3-panel": [24, 30, 24],
  "neo-angle": [30, 30, 30],
  "sliding-bypass": [60],
};

function makeEnclosure(id: string, n: number): EnclosureConfig {
  return {
    id, label: "Enclosure " + n, style: "door-inline-panel",
    widthsIn: [...DEFAULT_WIDTHS["door-inline-panel"]], heightIn: 76,
    thickness: '1/2"', glass: "clear", finish: "chrome", extraHandles: 0,
    cutouts: { handleHoles: 0, hingeCutouts: 0, notches: 0, towelBars: 0 },
  };
}

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ShowersPage() {
  const counter = useRef(1);
  const [enclosures, setEnclosures] = useState<EnclosureConfig[]>([makeEnclosure("e1", 1)]);
  const project = useMemo(() => priceProject(enclosures), [enclosures]);

  const update = (id: string, patch: Partial<EnclosureConfig>) =>
    setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const setStyle = (id: string, style: ShowerStyle) =>
    update(id, { style, widthsIn: [...DEFAULT_WIDTHS[style]] });
  const setWidth = (id: string, i: number, v: number) =>
    setEnclosures((l) => l.map((e) => { if (e.id !== id) return e; const w = [...e.widthsIn]; w[i] = v; return { ...e, widthsIn: w }; }));
  const setCut = (id: string, key: keyof EnclosureConfig["cutouts"], v: number) =>
    setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, cutouts: { ...e.cutouts, [key]: Math.max(0, v) } } : e)));
  const add = () => { counter.current += 1; const n = counter.current; setEnclosures((l) => [...l, makeEnclosure("e" + n, n)]); };
  const remove = (id: string) => setEnclosures((l) => (l.length > 1 ? l.filter((e) => e.id !== id) : l));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-xl">&#128703;</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shower Estimator</h1>
            <p className="text-sm text-slate-500">Build a frameless shower quote &mdash; add as many enclosures as the job needs.</p>
          </div>
        </div>
        <button onClick={add} className="rounded-lg bg-emerald-600 text-white font-medium px-4 py-2.5 text-sm hover:bg-emerald-700">+ Add enclosure</button>
      </div>

      <div className="space-y-6">
        {enclosures.map((e, idx) => {
          const est = project.enclosures[idx];
          const style = SHOWER_STYLES.find((s) => s.id === e.style)!;
          return (
            <div key={e.id} className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <input value={e.label} onChange={(ev) => update(e.id, { label: ev.target.value })}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none" />
                <div className="flex items-center gap-4">
                  <span className="text-emerald-700 font-bold">{money(est?.subtotal || 0)}</span>
                  {enclosures.length > 1 && <button onClick={() => remove(e.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                </div>
              </div>

              <div className="p-5 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SHOWER_STYLES.map((s) => (
                        <button key={s.id} onClick={() => setStyle(e.id, s.id)}
                          className={"text-left rounded-lg border px-3 py-2 text-sm " + (e.style === s.id ? "border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50" : "border-slate-200 hover:border-slate-300")}>
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.door === "sliding" ? "Sliding" : "Swing"}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Dimensions (inches)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {style.widths.map((wl, i) => (
                        <NumberField key={i} label={wl} value={e.widthsIn[i] ?? 0} onChange={(v) => setWidth(e.id, i, v)} />
                      ))}
                      <NumberField label="Height" value={e.heightIn} onChange={(v) => update(e.id, { heightIn: v })} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Glass area: <b>{est?.sqft ?? 0} sq ft</b></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <SelectField label="Thickness" value={e.thickness} onChange={(v) => update(e.id, { thickness: v as GlassThickness })} options={THICKNESSES.map((t) => ({ value: t, label: t }))} />
                    <SelectField label="Glass" value={e.glass} onChange={(v) => update(e.id, { glass: v as GlassType })} options={GLASS_TYPES.map((t) => ({ value: t, label: t }))} />
                    <SelectField label="Finish" value={e.finish} onChange={(v) => update(e.id, { finish: v as Finish })} options={FINISHES.map((f) => ({ value: f.id, label: f.name }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Hardware &amp; cutouts</label>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField label="Extra handles" value={e.extraHandles} onChange={(v) => update(e.id, { extraHandles: Math.max(0, v) })} />
                      <NumberField label="Towel bars" value={e.cutouts.towelBars} onChange={(v) => setCut(e.id, "towelBars", v)} />
                      <NumberField label="Handle / accessory holes" value={e.cutouts.handleHoles} onChange={(v) => setCut(e.id, "handleHoles", v)} />
                      <NumberField label="Hinge cutouts" value={e.cutouts.hingeCutouts} onChange={(v) => setCut(e.id, "hingeCutouts", v)} />
                      <NumberField label="Corner / knee-wall notches" value={e.cutouts.notches} onChange={(v) => setCut(e.id, "notches", v)} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Price breakdown</div>
                  <div className="space-y-1.5">
                    {est?.lineItems.map((li, i) => (
                      <div key={i} className="flex items-baseline justify-between text-sm gap-3">
                        <span className="text-slate-600">{li.label} <span className="text-slate-400">&times; {li.qty} @ {money(li.rate)}</span></span>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{money(li.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Enclosure total</span>
                    <span className="font-bold text-emerald-700 text-lg">{money(est?.subtotal || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-emerald-600 text-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-sm text-emerald-100">Project total &middot; {enclosures.length} enclosure{enclosures.length > 1 ? "s" : ""}</div>
          <div className="text-xs text-emerald-200">Materials, hardware, fabrication &amp; labor</div>
        </div>
        <div className="text-3xl font-bold">{money(project.subtotal)}</div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <input type="number" min={0} value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 capitalize">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
