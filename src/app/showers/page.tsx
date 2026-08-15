"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SHOWER_STYLES, GLASS_TYPES, THICKNESSES, FINISHES, DEFAULT_DEDUCTIONS, DOOR_TYPES, STANDARD_SIZES, DEFAULT_PONY_WALL, POPULAR_MODELS, DEFAULT_HARDWARE, POPULAR_DOOR_WIDTHS, POPULAR_DOOR_HEIGHTS, HANDLE_TYPES, TOWEL_BAR_TYPES, HINGE_TYPES, CLAMP_TYPES, HANDLE_HOLE_SIZES } from "@/lib/shower/types";
import { HARDWARE_REFERENCE } from "@/lib/shower/hardware-reference";
import type { EnclosureConfig, ShowerStyle, GlassThickness, GlassType, Finish, RateTable, Deductions, Opening, DoorType, StandardSize, PonyWall, PopularModel, HardwareLayout, HardwarePlacement } from "@/lib/shower/types";
import { priceProject } from "@/lib/shower/pricing";
import { DEFAULT_SHOWER_RATES } from "@/lib/shower/rates";
import { layoutEnclosure, formatDim, parseInches, panelSizeLabel, defaultOpenings, suggestThickness, ponyWallRows, resolveHardware, standardHardware, hardwareRows, slidingExtras, fabNote, fabSummary } from "@/lib/shower/glass";
import ShowerDrawing from "@/components/ShowerDrawing";
import SketchPad from "@/components/SketchPad";
import type { SketchResult } from "@/lib/shower/sketch";
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
  const [showRef, setShowRef] = useState(false);
  const [planView, setPlanView] = useState(false);
  const [sketchFor, setSketchFor] = useState<string | null>(null);
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

  // ---- v2: door type, standard sizes, rough opening ----
  const doorTypeOf = (e: EnclosureConfig): DoorType => e.doorType || (e.style === "sliding-bypass" ? "bypass" : "hinged");
  const setDoorType = (id: string, dt: DoorType) => update(id, { doorType: dt });
  const doorIndex = (style: ShowerStyle) => {
    const i = (SHOWER_STYLES.find((s) => s.id === style)?.widths || []).findIndex((w) => /door|opening|slid/i.test(w));
    return i < 0 ? 0 : i;
  };
  const applyStdSize = (id: string, size: StandardSize) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const di = doorIndex(e.style);
    const widthsIn = e.widthsIn.map((w, i) => (i === di ? size.widthIn : w));
    return { ...e, widthsIn, heightIn: size.heightIn, openingWidthIn: size.widthIn, openingHeightIn: size.heightIn + 2 };
  }));
  const fitToOpening = (id: string) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id || !e.openingWidthIn) return e;
    const cur = e.widthsIn.reduce((s, w) => s + w, 0) || 1;
    const scale = (e.openingWidthIn as number) / cur;
    const widthsIn = e.widthsIn.map((w) => Math.round(w * scale * 10) / 10);
    const heightIn = e.openingHeightIn ? Math.max(1, (e.openingHeightIn as number) - 2) : e.heightIn;
    return { ...e, widthsIn, heightIn };
  }));
  // Popular width / height quick picks (door lite width + overall height).
  const setDoorWidth = (id: string, w: number) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const di = doorIndex(e.style);
    const widthsIn = e.widthsIn.map((x, i) => (i === di ? w : x));
    return { ...e, widthsIn, openingWidthIn: w };
  }));
  const setDoorHeight = (id: string, h: number) => update(id, { heightIn: h, openingHeightIn: h + 2 });
  // Handle & towel-bar configuration (popular sets). Selecting a pull with a
  // center-to-center also syncs the hardware layout's handle CTC.
  const setHandleType = (id: string, hid: string) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const opt = HANDLE_TYPES.find((h) => h.id === hid);
    const hardware = e.hardware && opt && opt.ctcIn > 0 ? { ...e.hardware, handleCtcIn: opt.ctcIn } : e.hardware;
    return { ...e, handleType: hid, hardware };
  }));
  const setTowelBar = (id: string, tid: string) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const bars = tid === "none" ? 0 : Math.max(1, e.cutouts.towelBars || 0);
    return { ...e, towelBarType: tid, cutouts: { ...e.cutouts, towelBars: bars } };
  }));
  const togglePony = (id: string, on: boolean) => setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, ponyWall: on ? { ...DEFAULT_PONY_WALL, panelHeightIn: e.heightIn } : undefined } : e)));
  const setPony = (id: string, patch: Partial<PonyWall>) => setEnclosures((l) => l.map((e) => (e.id === id && e.ponyWall ? { ...e, ponyWall: { ...e.ponyWall, ...patch } } : e)));

  // ---- Popular models (quick-pick presets) ----
  const applyModel = (id: string, m: PopularModel) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const widthsIn = [...(DEFAULT_WIDTHS[m.style] || e.widthsIn)];
    const di = doorIndex(m.style);
    if (widthsIn[di] != null) widthsIn[di] = m.widthIn;
    return { ...e, style: m.style, doorType: m.doorType, widthsIn, heightIn: m.heightIn, thickness: m.thickness, finish: m.finish, openingWidthIn: m.widthIn, openingHeightIn: m.heightIn + 2 };
  }));
  // Apply a finger-sketch result: set the detected style + proportional wall
  // widths. Height and the rest stay as they are for the dealer to fine-tune.
  const applySketch = (id: string, r: SketchResult) => {
    setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, style: r.style, widthsIn: [...r.widthsIn] } : e)));
    setSketchFor(null);
  };

  // ---- Hardware layout (holes / hinges / clamps) ----
  const toggleHardware = (id: string, on: boolean) => setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, hardware: on ? { ...(e.hardware || DEFAULT_HARDWARE), enabled: true } : (e.hardware ? { ...e.hardware, enabled: false } : undefined) } : e)));
  const setHardware = (id: string, patch: Partial<HardwareLayout>) => setEnclosures((l) => l.map((e) => (e.id === id && e.hardware ? { ...e, hardware: { ...e.hardware, ...patch } } : e)));
  // Switch to custom positions, seeding from the standard set so nothing is lost.
  const customizeHardware = (id: string, on: boolean) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id) return e;
    const base = e.hardware || { ...DEFAULT_HARDWARE };
    if (!on) return { ...e, hardware: { ...base, useStandard: true } };
    const placements = base.placements.length ? base.placements : standardHardware(effCfg(e));
    return { ...e, hardware: { ...base, useStandard: false, placements } };
  }));
  const setPlacement = (id: string, i: number, patch: Partial<HardwarePlacement>) => setEnclosures((l) => l.map((e) => {
    if (e.id !== id || !e.hardware) return e;
    const placements = e.hardware.placements.map((p, j) => (j === i ? { ...p, ...patch } : p));
    return { ...e, hardware: { ...e.hardware, placements } };
  }));
  const resetPlacements = (id: string) => setEnclosures((l) => l.map((e) => (e.id === id && e.hardware ? { ...e, hardware: { ...e.hardware, placements: standardHardware(effCfg(e)) } } : e)));
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
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Master bath remodel" className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
        <label className="block">
          <span className="block text-[11px] text-slate-500 mb-1 uppercase tracking-wide font-semibold">Client</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Customer name" className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <button type="button" onClick={() => setShowGaps((v) => !v)} className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
          Glass gaps / deductions <span className="text-slate-400">{showGaps ? "▲" : "▼"}</span>
        </button>
        {showGaps && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <FractionField label="Door hinge gap" value={deductions.doorHingeGap} onChange={(v) => setDeductions((d) => ({ ...d, doorHingeGap: v }))} step />
              <FractionField label="Door strike gap" value={deductions.doorStrikeGap} onChange={(v) => setDeductions((d) => ({ ...d, doorStrikeGap: v }))} step />
              <FractionField label="Door top gap" value={deductions.doorTopGap} onChange={(v) => setDeductions((d) => ({ ...d, doorTopGap: v }))} step />
              <FractionField label="Door bottom gap" value={deductions.doorBottomGap} onChange={(v) => setDeductions((d) => ({ ...d, doorBottomGap: v }))} step />
              <FractionField label="Panel side gap" value={deductions.panelSideGap} onChange={(v) => setDeductions((d) => ({ ...d, panelSideGap: v }))} step />
              <FractionField label="Panel top gap" value={deductions.panelTopGap} onChange={(v) => setDeductions((d) => ({ ...d, panelTopGap: v }))} step />
              <FractionField label="Panel bottom gap" value={deductions.panelBottomGap} onChange={(v) => setDeductions((d) => ({ ...d, panelBottomGap: v }))} step />
              <FractionField label="Sliding overlap" value={deductions.slidingOverlap} onChange={(v) => setDeductions((d) => ({ ...d, slidingOverlap: v }))} step />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Gaps subtracted from field openings to get ordered glass sizes (inches). Applies to every enclosure and saves with the estimate.</p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <button type="button" onClick={() => setShowRef((v) => !v)} className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
          Hardware reference — clamps, hinges, sliding, handles <span className="text-slate-400">{showRef ? "▲" : "▼"}</span>
        </button>
        {showRef && (
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            {HARDWARE_REFERENCE.map((sec) => (
              <div key={sec.title} className="rounded-lg border border-slate-100 p-3">
                <div className="text-xs font-semibold text-slate-800">{sec.title}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-2">{sec.blurb}</p>
                <table className="w-full text-[11px]">
                  <tbody>
                    {sec.rows.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 align-top">
                        <td className="py-1 pr-2 text-slate-700 font-medium whitespace-nowrap">{r.label}</td>
                        <td className="py-1 pr-2 text-slate-500">{r.spec}</td>
                        <td className="py-1 text-right whitespace-nowrap"><span className={r.fab.startsWith("Drilled") ? "text-amber-600" : r.fab.includes("notch") ? "text-rose-600" : "text-slate-400"}>{r.fab}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="md:col-span-2 text-[11px] text-slate-400">Brand-neutral specs compiled from published manufacturer catalogs &amp; install guides (CRL, FHC, PRL, Leader). Positions follow common install spacing; confirm your specific hardware&apos;s template before fabrication.</p>
          </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Sketch the opening <span className="normal-case font-normal text-emerald-600">— draw it, we build it</span></label>
                      <button type="button" onClick={() => setSketchFor(sketchFor === e.id ? null : e.id)}
                        className={"text-xs rounded-lg border px-2.5 py-1 " + (sketchFor === e.id ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50")}>
                        {sketchFor === e.id ? "Hide" : "✏️ Sketch"}
                      </button>
                    </div>
                    {sketchFor === e.id && <SketchPad onApply={(r) => applySketch(e.id, r)} onClose={() => setSketchFor(null)} />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Popular models <span className="normal-case font-normal text-slate-400">— quick start, fully editable</span></label>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_MODELS.map((m) => (
                        <button key={m.id} type="button" onClick={() => applyModel(e.id, m)} title={m.blurb}
                          className="rounded-full border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 px-2.5 py-1 text-xs">
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Door type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DOOR_TYPES.map((dt) => (
                        <button key={dt.id} type="button" onClick={() => setDoorType(e.id, dt.id)}
                          className={"text-left rounded-lg border px-3 py-2 text-sm " + (doorTypeOf(e) === dt.id ? "border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50" : "border-slate-200 hover:border-slate-300")}>
                          <div className="font-medium text-slate-800">{dt.name}</div>
                          <div className="text-[11px] text-slate-500">{dt.blurb}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="block">
                        <span className="block text-[11px] text-slate-500 mb-1">Standard size (W × H)</span>
                        <select className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2 py-1.5 text-sm" value=""
                          onChange={(ev) => { const i = parseInt(ev.target.value); if (!Number.isNaN(i)) applyStdSize(e.id, STANDARD_SIZES[doorTypeOf(e)][i]); }}>
                          <option value="">Pick a standard size…</option>
                          {STANDARD_SIZES[doorTypeOf(e)].map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="block text-[11px] text-slate-500 mb-1">Door width</span>
                        <select className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2 py-1.5 text-sm"
                          value={POPULAR_DOOR_WIDTHS.includes(e.widthsIn[doorIndex(e.style)] ?? -1) ? String(e.widthsIn[doorIndex(e.style)]) : "custom"}
                          onChange={(ev) => { if (ev.target.value !== "custom") setDoorWidth(e.id, parseFloat(ev.target.value)); }}>
                          {POPULAR_DOOR_WIDTHS.map((w) => <option key={w} value={w}>{w}&quot;</option>)}
                          <option value="custom">Custom…</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="block text-[11px] text-slate-500 mb-1">Height</span>
                        <select className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2 py-1.5 text-sm"
                          value={POPULAR_DOOR_HEIGHTS.includes(e.heightIn) ? String(e.heightIn) : "custom"}
                          onChange={(ev) => { if (ev.target.value !== "custom") setDoorHeight(e.id, parseFloat(ev.target.value)); }}>
                          {POPULAR_DOOR_HEIGHTS.map((h) => <option key={h} value={h}>{h}&quot;</option>)}
                          <option value="custom">Custom…</option>
                        </select>
                      </label>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <FractionField label="Opening W (wall-to-wall)" value={e.openingWidthIn || 0} onChange={(v) => update(e.id, { openingWidthIn: v })} />
                      <FractionField label="Opening H (floor–header)" value={e.openingHeightIn || 0} onChange={(v) => update(e.id, { openingHeightIn: v })} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => fitToOpening(e.id)} disabled={!e.openingWidthIn}
                        className="text-xs rounded-lg border border-emerald-300 text-emerald-700 px-2.5 py-1 hover:bg-emerald-50 disabled:opacity-50">Fit glass to opening</button>
                      {(() => { const sug = suggestThickness(effCfg(e)); return sug !== e.thickness
                        ? <button type="button" onClick={() => update(e.id, { thickness: sug })} className="text-xs rounded-lg border border-amber-300 text-amber-700 px-2.5 py-1 hover:bg-amber-50">Suggested glass: {sug} — apply</button>
                        : <span className="text-[11px] text-slate-400">Glass {e.thickness} ✓ for this size</span>; })()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Enter the rough opening (wall-to-wall) or pick a standard size; the drawing &amp; glass sizes update below.</p>
                  </div>
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
                        <FractionField key={i} label={wl} value={e.widthsIn[i] ?? 0} onChange={(v) => setWidth(e.id, i, v)} />
                      ))}
                      <FractionField label="Height" value={e.heightIn} onChange={(v) => update(e.id, { heightIn: v })} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Glass area: <b>{est?.sqft ?? 0} sq ft</b> &middot; type any custom cut, e.g. <span className="font-medium text-slate-500">79 1/4&quot;</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <SelectField label="Thickness" value={e.thickness} onChange={(v) => update(e.id, { thickness: v as GlassThickness })} options={THICKNESSES.map((t) => ({ value: t, label: t }))} />
                    <SelectField label="Glass" value={e.glass} onChange={(v) => update(e.id, { glass: v as GlassType })} options={GLASS_TYPES.map((t) => ({ value: t, label: t }))} />
                    <SelectField label="Finish" value={e.finish} onChange={(v) => update(e.id, { finish: v as Finish })} options={FINISHES.map((f) => ({ value: f.id, label: f.name }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Hardware &amp; cutouts</label>
                    <div className="grid grid-cols-2 gap-2">
                      <SelectField label="Handle / pull" value={e.handleType || "pull-6"} onChange={(v) => setHandleType(e.id, v)} options={HANDLE_TYPES.map((h) => ({ value: h.id, label: h.name }))} />
                      <SelectField label="Towel bar" value={e.towelBarType || "none"} onChange={(v) => setTowelBar(e.id, v)} options={TOWEL_BAR_TYPES.map((t) => ({ value: t.id, label: t.name }))} />
                      <NumberField label="Extra handles" value={e.extraHandles} onChange={(v) => update(e.id, { extraHandles: Math.max(0, v) })} />
                      <NumberField label="Handle / accessory holes" value={e.cutouts.handleHoles} onChange={(v) => setCut(e.id, "handleHoles", v)} />
                      <NumberField label="Hinge cutouts" value={e.cutouts.hingeCutouts} onChange={(v) => setCut(e.id, "hingeCutouts", v)} />
                      <NumberField label="Corner / knee-wall notches" value={e.cutouts.notches} onChange={(v) => setCut(e.id, "notches", v)} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      <span>Hardware layout — holes &amp; clamps</span>
                      <input type="checkbox" checked={!!e.hardware?.enabled} onChange={(ev) => toggleHardware(e.id, ev.target.checked)} className="accent-emerald-600" />
                    </label>
                    {e.hardware?.enabled && (
                      <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <SelectField label="Hinge type" value={e.hardware.hingeType || "wall-geneva"} onChange={(v) => setHardware(e.id, { hingeType: v })} options={HINGE_TYPES.map((h) => ({ value: h.id, label: h.name }))} />
                          <SelectField label="Clamp type" value={e.hardware.clampType || "glass-wall"} onChange={(v) => setHardware(e.id, { clampType: v })} options={CLAMP_TYPES.map((c) => ({ value: c.id, label: c.name }))} />
                        </div>
                        <div className="text-[11px] text-slate-400 -mt-1 space-y-0.5">
                          {(() => { const h = HINGE_TYPES.find((x) => x.id === (e.hardware!.hingeType || "wall-geneva")); return <div>🔩 {h?.note} <span className="text-slate-300">· fits {h?.glass}</span></div>; })()}
                          {(() => { const c = CLAMP_TYPES.find((x) => x.id === (e.hardware!.clampType || "glass-wall")); return <div>🗜️ {c?.note} <span className="text-slate-300">· {c?.angle}° · fits {c?.glass}</span></div>; })()}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <FractionField label="Handle CTC" value={e.hardware.handleCtcIn} onChange={(v) => setHardware(e.id, { handleCtcIn: v })} step />
                          <FractionField label="Handle height (floor)" value={e.hardware.handleHeightIn} onChange={(v) => setHardware(e.id, { handleHeightIn: v })} />
                          <NumberField label="Clamps / panel" value={e.hardware.clampsPerJoint} onChange={(v) => setHardware(e.id, { clampsPerJoint: Math.max(2, Math.min(3, Math.round(v))) })} />
                          <SelectField label="Handle hole ⌀" value={String(e.hardware.holeDiaIn ?? 0.5)} onChange={(v) => setHardware(e.id, { holeDiaIn: parseFloat(v) })} options={HANDLE_HOLE_SIZES.map((h) => ({ value: String(h.diaIn), label: h.label }))} />
                        </div>
                        <div className="rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-[11px] text-emerald-800">🛠 {fabSummary(effCfg(e))}</div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input type="checkbox" checked={!e.hardware.useStandard} onChange={(ev) => customizeHardware(e.id, ev.target.checked)} className="accent-emerald-600" />
                          Customize hole &amp; clamp positions
                        </label>
                        <div className="flex gap-3 items-start">
                          <div className="flex-1 min-w-0">
                            {e.hardware.useStandard ? (
                              <div className="text-[11px] text-slate-500 space-y-0.5 max-h-44 overflow-auto pr-1">
                                {resolveHardware(effCfg(e)).map((h, hi) => (
                                  <div key={hi} className="flex items-center justify-between gap-2">
                                    <span className="text-slate-600 whitespace-nowrap">{h.label}</span>
                                    <span className="whitespace-nowrap"><span className="text-slate-400">{formatDim(h.fromTopIn)} top · {formatDim(h.fromEdgeIn)} edge</span> <span className={h.fab === "hole" ? "text-amber-600" : h.fab === "notch" ? "text-rose-600" : "text-slate-400"}>· {fabNote(h)}</span></span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-56 overflow-auto pr-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-slate-400">From top · from near edge (in)</span>
                                  <button type="button" onClick={() => resetPlacements(e.id)} className="text-[11px] text-emerald-700 hover:underline">Reset to standard</button>
                                </div>
                                {(e.hardware.placements || []).map((p, pi) => (
                                  <div key={p.id} className="grid grid-cols-[1fr_auto_auto] gap-1.5 items-center">
                                    <span className="text-[11px] text-slate-600 truncate" title={p.label}>{p.label}</span>
                                    <input type="number" step={0.0625} value={p.fromTopIn} onChange={(ev) => setPlacement(e.id, pi, { fromTopIn: parseFloat(ev.target.value) || 0 })} className="w-16 rounded border border-slate-300 bg-white text-slate-900 px-1.5 py-1 text-xs" />
                                    <input type="number" step={0.0625} value={p.fromEdgeIn} onChange={(ev) => setPlacement(e.id, pi, { fromEdgeIn: parseFloat(ev.target.value) || 0 })} className="w-16 rounded border border-slate-300 bg-white text-slate-900 px-1.5 py-1 text-xs" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <HardwareMap cfg={effCfg(e)} />
                        </div>
                        <p className="text-[11px] text-slate-400">Positions follow common CRL install spacing. <span className="text-teal-700">▮</span> hinge (edge, no cutout) · <span className="text-amber-600">◯</span> drilled hole · <span className="text-rose-600">▣</span> notch · <span className="text-violet-600">▮</span> clamp (edge). Positions &amp; fabrication print on the shop order.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      <span>Pony / knee wall</span>
                      <input type="checkbox" checked={!!e.ponyWall} onChange={(ev) => togglePony(e.id, ev.target.checked)} className="accent-emerald-600" />
                    </label>
                    {e.ponyWall && (
                      <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <FractionField label="Knee wall H" value={e.ponyWall.heightIn} onChange={(v) => setPony(e.id, { heightIn: v })} />
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 pb-2"><input type="checkbox" checked={e.ponyWall.hasReturn} onChange={(ev) => setPony(e.id, { hasReturn: ev.target.checked })} className="accent-emerald-600" />90° return</label>
                          {e.ponyWall.hasReturn ? <FractionField label="Return W" value={e.ponyWall.returnWidthIn} onChange={(v) => setPony(e.id, { returnWidthIn: v })} /> : <div />}
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={e.ponyWall.notched} onChange={(ev) => setPony(e.id, { notched: ev.target.checked })} className="accent-emerald-600" />Notched panel (custom cut)</label>
                        {e.ponyWall.notched && (
                          <div className="flex gap-3 items-center">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <FractionField label="Panel W" value={e.ponyWall.panelWidthIn ?? 24} onChange={(v) => setPony(e.id, { panelWidthIn: v })} />
                              <FractionField label="Panel H" value={e.ponyWall.panelHeightIn ?? e.heightIn} onChange={(v) => setPony(e.id, { panelHeightIn: v })} />
                              <FractionField label="Notch W" value={e.ponyWall.notchWidthIn} onChange={(v) => setPony(e.id, { notchWidthIn: v })} />
                              <FractionField label="Notch H" value={e.ponyWall.notchHeightIn} onChange={(v) => setPony(e.id, { notchHeightIn: v })} />
                            </div>
                            <NotchedPanel pw={e.ponyWall} />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400">The 90° return + notched panel are added to the glass list / shop order below.</p>
                      </div>
                    )}
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
                            <td className="py-1.5 font-medium text-slate-900">{p.square ? (formatDim(p.wTop) + " × " + formatDim(p.hLeft)) : panelSizeLabel(p)}</td>
                          </tr>
                        ))}
                        {slidingExtras(eff).map((r, ri) => (
                          <tr key={"sx" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-sky-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 text-slate-600 text-xs">{r.size}</td>
                          </tr>
                        ))}
                        {ponyWallRows(eff).map((r, ri) => (
                          <tr key={"pw" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-emerald-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 font-medium text-slate-900">{r.size}</td>
                          </tr>
                        ))}
                        {hardwareRows(eff).map((r, ri) => (
                          <tr key={"hw" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-violet-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 text-slate-600 text-xs">{r.size}</td>
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
                          <FractionField label="W top" value={o.widthTop} onChange={(v) => setOpening(e.id, oi, { widthTop: v })} step />
                          <FractionField label="W bottom" value={o.widthBottom} onChange={(v) => setOpening(e.id, oi, { widthBottom: v })} step />
                          <FractionField label="H left" value={o.heightLeft} onChange={(v) => setOpening(e.id, oi, { heightLeft: v })} step />
                          <FractionField label="H right" value={o.heightRight} onChange={(v) => setOpening(e.id, oi, { heightRight: v })} step />
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
              <input type="number" min={0} value={markupPct} onChange={(e) => setMarkupPct(parseFloat(e.target.value) || 0)} className="w-16 rounded border border-slate-300 bg-white text-slate-900 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <span>%</span>
            </div>
            <span className="font-medium text-slate-800">+{money(markupAmt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span>Tax</span>
              <input type="number" min={0} value={taxPct} onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)} className="w-16 rounded border border-slate-300 bg-white text-slate-900 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
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

function NotchedPanel({ pw }: { pw: PonyWall }) {
  const W = Math.max(1, pw.panelWidthIn ?? 24), H = Math.max(1, pw.panelHeightIn ?? 76);
  const nW = Math.min(pw.notchWidthIn, W * 0.9), nH = Math.min(pw.notchHeightIn, H * 0.9);
  const pts = `0,0 ${W},0 ${W},${H} ${nW},${H} ${nW},${H - nH} 0,${H - nH}`;
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} width="66" style={{ display: "block" }} role="img" aria-label="Notched panel shape">
      <polygon points={pts} fill="#cfe6ea" fillOpacity={0.6} stroke="#0f766e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Schematic elevation with hole / hinge / clamp dots plotted from their measured
// positions. Read-only; mirrors the panels of the current enclosure.
function HardwareMap({ cfg }: { cfg: EnclosureConfig }) {
  const { panels, totalW, maxH } = layoutEnclosure(cfg);
  const places = resolveHardware(cfg);
  if (!totalW || !maxH) return null;
  const scale = 150 / Math.max(1, totalW);
  const pad = 8;
  const W = totalW * scale + pad * 2, H = maxH * scale + pad * 2;
  let cursor = 0;
  const offs = panels.map((p) => { const o = cursor; cursor += Math.max(p.wTop, p.wBottom); return o; });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="120" style={{ display: "block", flex: "none" }} role="img" aria-label="Hardware positions">
      {panels.map((p, i) => {
        const px = pad + offs[i] * scale;
        const pw = Math.max(1, Math.max(p.wTop, p.wBottom)) * scale;
        const ph = Math.max(1, p.hLeft || maxH) * scale;
        return (
          <g key={i}>
            <rect x={px} y={pad} width={pw} height={ph} fill="#eef6f7" stroke="#94a3b8" strokeWidth={1} />
            {places.filter((pl) => (pl.panelIndex ?? -1) === i).map((pl, j) => {
              const cx = px + Math.min(pw, pl.fromEdgeIn * scale);
              const cy = pad + Math.min(ph, pl.fromTopIn * scale);
              // Drilled hole → amber ring; notch → rose square; edge clamp/hinge → tick on the glass edge.
              if (pl.fab === "hole") return <circle key={j} cx={cx} cy={cy} r={2.8} fill="none" stroke="#d97706" strokeWidth={1.4} />;
              if (pl.fab === "notch") return <rect key={j} x={cx - 2.4} y={cy - 2.4} width={4.8} height={4.8} fill="#e11d48" fillOpacity={0.85} />;
              const edgeColor = pl.kind === "hinge" ? "#0f766e" : "#7c3aed";
              return <rect key={j} x={cx - 0.8} y={cy - 3} width={2.4} height={6} rx={0.6} fill={edgeColor} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function NumberField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <input type="number" min={0} step={step ? 0.0625 : undefined} value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
    </label>
  );
}

// Fraction-aware dimension field: dealers can type an exact custom cut like
// "79 1/4"", "80 1/2"", "1/2"" or a plain decimal. Shows the shop fraction when
// not being edited; parses live and keeps the last good value while typing.
// `step` is accepted for call-site compatibility with NumberField but unused.
function FractionField({ label, value, onChange, step: _step }: { label: string; value: number; onChange: (v: number) => void; step?: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const display = text !== null ? text : (Number.isFinite(value) && value > 0 ? formatDim(value) : "");
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <input type="text" inputMode="text" value={display} placeholder={"e.g. 30 or 79 1/4\""}
        onChange={(ev) => { setText(ev.target.value); const v = parseInches(ev.target.value); if (v !== null) onChange(v); }}
        onBlur={() => { const v = parseInches(text ?? ""); if (v !== null) onChange(v); setText(null); }}
        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 capitalize">
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
