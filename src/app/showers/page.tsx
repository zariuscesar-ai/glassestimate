"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SHOWER_STYLES, GLASS_TYPES, THICKNESSES, FINISHES, DEFAULT_DEDUCTIONS } from "@/lib/shower/types";
import type { EnclosureConfig, ShowerStyle, GlassThickness, GlassType, Finish, RateTable, Deductions, Opening } from "@/lib/shower/types";
import { priceProject } from "@/lib/shower/pricing";
import { DEFAULT_SHOWER_RATES } from "@/lib/shower/rates";
import { layoutEnclosure, formatIn, panelSizeLabel, defaultOpenings } from "@/lib/shower/glass";
import ShowerDrawing from "@/components/ShowerDrawing";
import ShowerPlan from "@/components/ShowerPlan";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

function Configurator() {
  const counter = useRef(1);
  const [enclosures, setEnclosures] = useState<EnclosureConfig[]>([makeEnclosure("e1", 1)]);
  const [rates, setRates] = useState<RateTable>(DEFAULT_SHOWER_RATES);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [markupPct, setMarkupPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [deductions, setDeductions] = useState<Deductions>(DEFAULT_DEDUCTIONS);
  const [showGaps, setShowGaps] = useState(false);
  const [planView, setPlanView] = useState(false);
  const [companySlug, setCompanySlug] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const editId = params.get("id");
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  useEffect(() => {
    fetch("/api/companies").then((r) => (r.ok ? r.json() : [])).then((list) => {
      const c = Array.isArray(list) ? list[0] : null;
      if (c && c.shower_rates) setRates(c.shower_rates as RateTable);
      if (c && typeof c.default_tax_rate === "number") setTaxPct(c.default_tax_rate);
      if (c && c.slug) setCompanySlug(c.slug);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    fetch("/api/shower-estimates/" + editId).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setProjectName(d.project_name || "");
      setClientName(d.client_name || "");
      setMarkupPct(d.markup_pct || 0);
      setTaxPct(d.tax_pct || 0);
      if (Array.isArray(d.enclosures) && d.enclosures.length) {
        setEnclosures(d.enclosures);
        const ded = d.enclosures.find((e: EnclosureConfig) => e.measure?.deductions)?.measure?.deductions;
        if (ded) setDeductions({ ...DEFAULT_DEDUCTIONS, ...ded });
      }
      setSavedId(String(d.id));
    }).catch(() => {});
  }, [editId]);
  const project = useMemo(() => priceProject(enclosures, rates), [enclosures, rates]);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const markupAmt = r2((project.subtotal * (markupPct || 0)) / 100);
  const afterMarkup = r2(project.subtotal + markupAmt);
  const taxAmt = r2((afterMarkup * (taxPct || 0)) / 100);
  const grandTotal = r2(afterMarkup + taxAmt);

  const saveEstimate = async () => {
    setSaving(true); setSaveMsg("");
    const payload = {
      project_name: projectName, client_name: clientName,
      // Fold current gaps + any out-of-square measurements onto each enclosure so
      // the shop drawing/glass sizes reproduce exactly when reopened.
      enclosures: enclosures.map((e) => ({ ...e, measure: { outOfSquare: !!e.measure?.outOfSquare, openings: e.measure?.openings || [], deductions } })),
      markup_pct: markupPct, tax_pct: taxPct,
      subtotal: project.subtotal, total: grandTotal, status: "draft",
    };
    try {
      const url = savedId ? "/api/shower-estimates/" + savedId : "/api/shower-estimates";
      const r = await fetch(url, { method: savedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (!savedId && d && d.id) { setSavedId(String(d.id)); router.replace("/showers?id=" + d.id); }
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch { setSaveMsg("Save failed"); }
    finally { setSaving(false); }
  };

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
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/showers/request/${companySlug}`); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } catch { /* ignore */ }
  };

  // Merge the project-level gaps into an enclosure so the drawing/glass list
  // reflect the current deductions without mutating each row.
  const effCfg = (e: EnclosureConfig): EnclosureConfig => ({ ...e, measure: { outOfSquare: !!e.measure?.outOfSquare, openings: e.measure?.openings || [], deductions } });
  const toggleOOS = (id: string, on: boolean) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    if (on) { const openings = (e.measure?.openings?.length ? e.measure.openings : defaultOpenings(e)); return { ...e, measure: { outOfSquare: true, openings, deductions } }; }
    return { ...e, measure: { outOfSquare: false, openings: e.measure?.openings || [], deductions } };
  }));
  const setOpening = (id: string, i: number, patch: Partial<Opening>) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id || !e.measure) return e;
    const openings = e.measure.openings.map((o, j) => (j === i ? { ...o, ...patch } : o));
    return { ...e, measure: { ...e.measure, openings } };
  }));

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
        <div className="flex items-center gap-2">
          {companySlug ? <button type="button" onClick={copyLink} className="text-sm text-emerald-700 hover:underline px-2 py-2">{linkCopied ? "Link copied!" : "🔗 Customer link"}</button> : null}
          <Link href="/showers/saved" className="text-sm text-slate-500 hover:text-slate-700 px-2 py-2">Saved</Link>
          <Link href="/showers/rates" className="text-sm text-emerald-700 hover:underline px-2 py-2">Edit rates</Link>
          <button onClick={add} className="rounded-lg border border-emerald-300 text-emerald-700 font-medium px-3 py-2.5 text-sm hover:bg-emerald-50">+ Add enclosure</button>
          {savedId ? <Link href={"/showers/quote/" + savedId} className="text-sm text-emerald-700 hover:underline px-2 py-2">Quote</Link> : null}
          <button onClick={saveEstimate} disabled={saving} className="rounded-lg bg-emerald-600 text-white font-medium px-4 py-2.5 text-sm hover:bg-emerald-700 disabled:opacity-60">{saving ? "Saving..." : savedId ? "Update" : "Save"}</button>
          {saveMsg && <span className={"text-sm " + (saveMsg === "Saved" ? "text-green-600" : "text-red-500")}>{saveMsg}</span>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] text-slate-500 mb-1 uppercase tracking-wide font-semibold">Project name</span>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Master bath remodel" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
        <label className="block">
          <span className="block text-[11px] text-slate-500 mb-1 uppercase tracking-wide font-semibold">Client</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Customer name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <button type="button" onClick={() => setShowGaps((v) => !v)} className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
          Glass gaps / deductions <span className="text-slate-400">{showGaps ? "▲" : "▼"}</span>
        </button>
        {showGaps && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <NumberField label="Door hinge gap" value={deductions.doorHingeGap} onChange={(v) => setDeductions((d) => ({ ...d, doorHingeGap: v }))} step />
              <NumberField label="Door strike gap" value={deductions.doorStrikeGap} onChange={(v) => setDeductions((d) => ({ ...d, doorStrikeGap: v }))} step />
              <NumberField label="Door top gap" value={deductions.doorTopGap} onChange={(v) => setDeductions((d) => ({ ...d, doorTopGap: v }))} step />
              <NumberField label="Door bottom gap" value={deductions.doorBottomGap} onChange={(v) => setDeductions((d) => ({ ...d, doorBottomGap: v }))} step />
              <NumberField label="Panel side gap" value={deductions.panelSideGap} onChange={(v) => setDeductions((d) => ({ ...d, panelSideGap: v }))} step />
              <NumberField label="Panel top gap" value={deductions.panelTopGap} onChange={(v) => setDeductions((d) => ({ ...d, panelTopGap: v }))} step />
              <NumberField label="Panel bottom gap" value={deductions.panelBottomGap} onChange={(v) => setDeductions((d) => ({ ...d, panelBottomGap: v }))} step />
              <NumberField label="Sliding overlap" value={deductions.slidingOverlap} onChange={(v) => setDeductions((d) => ({ ...d, slidingOverlap: v }))} step />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Gaps subtracted from field openings to get ordered glass sizes (inches). Applies to every enclosure and saves with the estimate.</p>
          </>
        )}
      </div>

      <div className="space-y-6">
        {enclosures.map((e, idx) => {
          const est = project.enclosures[idx];
          const style = SHOWER_STYLES.find((s) => s.id === e.style)!;
          const eff = effCfg(e);
          const draw = layoutEnclosure(eff);
          const oos = !!e.measure?.outOfSquare;
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

              <div className="border-t border-emerald-100 px-5 py-5">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Shop drawing &amp; glass sizes</h3>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                      <button type="button" onClick={() => setPlanView(false)} className={(!planView ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50") + " px-2.5 py-1"}>Elevation</button>
                      <button type="button" onClick={() => setPlanView(true)} className={(planView ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50") + " px-2.5 py-1"}>Plan</button>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={oos} onChange={(ev) => toggleOOS(e.id, ev.target.checked)} className="accent-emerald-600" />
                      Walls out of square
                    </label>
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2">
                    {planView ? <ShowerPlan cfg={eff} /> : <ShowerDrawing cfg={eff} />}
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-[11px] text-slate-500 uppercase"><th className="py-1 font-semibold">Panel</th><th className="py-1 font-semibold">Glass size to order</th></tr></thead>
                      <tbody>
                        {draw.panels.map((p, pi) => (
                          <tr key={pi} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-slate-700 whitespace-nowrap">{p.label}</td>
                            <td className="py-1.5 font-medium text-slate-900">{p.square ? (formatIn(p.wTop) + " × " + formatIn(p.hLeft)) : panelSizeLabel(p)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[11px] text-slate-400 mt-2">{eff.thickness} {eff.glass} &middot; sizes include shop gaps, ready to cut. Price above uses nominal size.</p>
                  </div>
                </div>
                {oos && e.measure && e.measure.openings.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-2">Measured openings (inches)</div>
                    <div className="space-y-2">
                      {e.measure.openings.map((o, oi) => (
                        <div key={oi} className="grid grid-cols-5 gap-2 items-end">
                          <div className="text-xs text-slate-600 pb-1.5">{o.label}</div>
                          <NumberField label="W top" value={o.widthTop} onChange={(v) => setOpening(e.id, oi, { widthTop: v })} step />
                          <NumberField label="W bottom" value={o.widthBottom} onChange={(v) => setOpening(e.id, oi, { widthBottom: v })} step />
                          <NumberField label="H left" value={o.heightLeft} onChange={(v) => setOpening(e.id, oi, { heightLeft: v })} step />
                          <NumberField label="H right" value={o.heightRight} onChange={(v) => setOpening(e.id, oi, { heightRight: v })} step />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-2">Enter top &amp; bottom widths and left &amp; right heights — the drawing and glass sizes become true trapezoids.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Subtotal &middot; {enclosures.length} enclosure{enclosures.length > 1 ? "s" : ""} (materials + labor)</span>
            <span className="font-medium text-slate-800">{money(project.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span>Markup</span>
              <input type="number" min={0} value={markupPct} onChange={(e) => setMarkupPct(parseFloat(e.target.value) || 0)} className="w-16 rounded border border-slate-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <span>%</span>
            </div>
            <span className="font-medium text-slate-800">+{money(markupAmt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span>Tax</span>
              <input type="number" min={0} value={taxPct} onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)} className="w-16 rounded border border-slate-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <span>%</span>
            </div>
            <span className="font-medium text-slate-800">+{money(taxAmt)}</span>
          </div>
        </div>
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-emerald-100">Total &mdash; customer price</div>
            <div className="text-xs text-emerald-200">{projectName || "Untitled project"}{clientName ? " for " + clientName : ""}</div>
          </div>
          <div className="text-3xl font-bold">{money(grandTotal)}</div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <input type="number" min={0} step={step ? 0.0625 : undefined} value={Number.isFinite(value) ? value : 0}
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

export default function ShowersPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-400">Loading...</div>}>
      <Configurator />
    </Suspense>
  );
}
