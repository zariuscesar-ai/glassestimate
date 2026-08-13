"use client";

import { useEffect, useRef, useState } from "react";
import { SHOWER_STYLES, GLASS_TYPES, THICKNESSES, FINISHES } from "@/lib/shower/types";
import type { EnclosureConfig, ShowerStyle, GlassThickness, GlassType, Finish } from "@/lib/shower/types";
import ShowerDrawing from "@/components/ShowerDrawing";

const DEFAULT_WIDTHS: Record<ShowerStyle, number[]> = {
  "single-door": [30], "door-inline-panel": [30, 24], "corner-return": [36, 30],
  "inline-3-panel": [24, 30, 24], "neo-angle": [30, 30, 30], "sliding-bypass": [60],
};
function makeEnclosure(id: string, n: number): EnclosureConfig {
  return {
    id, label: "Enclosure " + n, style: "door-inline-panel",
    widthsIn: [...DEFAULT_WIDTHS["door-inline-panel"]], heightIn: 76,
    thickness: '1/2"', glass: "clear", finish: "chrome", extraHandles: 0,
    cutouts: { handleHoles: 0, hingeCutouts: 0, notches: 0, towelBars: 0 },
  };
}

export default function ShowerRequestPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const counter = useRef(1);
  const [brand, setBrand] = useState<{ name: string; logo: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [enclosures, setEnclosures] = useState<EnclosureConfig[]>([makeEnclosure("e1", 1)]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/public/shower-request/${slug}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.company) setBrand(d.company); }).catch(() => {}).finally(() => setLoaded(true));
  }, [slug]);

  const update = (id: string, patch: Partial<EnclosureConfig>) => setEnclosures((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const setStyle = (id: string, style: ShowerStyle) => update(id, { style, widthsIn: [...DEFAULT_WIDTHS[style]] });
  const setWidth = (id: string, i: number, v: number) => setEnclosures((l) => l.map((e) => { if (e.id !== id) return e; const w = [...e.widthsIn]; w[i] = v; return { ...e, widthsIn: w }; }));
  const add = () => { counter.current += 1; const n = counter.current; setEnclosures((l) => [...l, makeEnclosure("e" + n, n)]); };
  const remove = (id: string) => setEnclosures((l) => (l.length > 1 ? l.filter((e) => e.id !== id) : l));

  const submit = async () => {
    if (!name.trim() || (!email.trim() && !phone.trim())) { setErr("Please add your name and an email or phone."); return; }
    setSubmitting(true); setErr("");
    try {
      const r = await fetch(`/api/public/shower-request/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { name, email, phone }, projectName: note, enclosures }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not send your request.");
      setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not send your request."); }
    finally { setSubmitting(false); }
  };

  if (!loaded) return <div className="min-h-screen bg-slate-50" />;
  if (!brand) return <div className="min-h-screen flex items-center justify-center text-slate-400 px-6 text-center">This request link isn&apos;t active. Please contact the shop directly.</div>;

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 text-2xl flex items-center justify-center mx-auto mb-4">✓</div>
        <h1 className="text-xl font-bold text-slate-900">Request sent</h1>
        <p className="text-slate-500 text-sm mt-2">Thanks{name ? `, ${name.split(" ")[0]}` : ""} — your shower design is on its way to <span className="font-medium text-slate-700">{brand.name}</span>. They&apos;ll follow up with a quote.</p>
      </div>
    </div>
  );

  const seg = (active: boolean) => "px-2 py-1.5 rounded text-[11px] border " + (active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          {brand.logo ? <img src={brand.logo} alt="" className="h-10 w-10 object-contain" /> : <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-lg">🚿</span>}
          <div>
            <div className="font-bold text-slate-900">{brand.name}</div>
            <div className="text-xs text-slate-500">Design your shower — we&apos;ll send you a quote</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {enclosures.map((e, idx) => {
          const style = SHOWER_STYLES.find((s) => s.id === e.style)!;
          return (
            <div key={e.id} className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <span className="font-semibold text-slate-800">{e.label}</span>
                {enclosures.length > 1 && <button onClick={() => remove(e.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
              </div>
              <div className="p-5 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Shape</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SHOWER_STYLES.map((s) => (
                        <button key={s.id} onClick={() => setStyle(e.id, s.id)} className={"text-left rounded-lg border px-3 py-2 text-sm " + (e.style === s.id ? "border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50" : "border-slate-200 hover:border-slate-300")}>
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.door === "sliding" ? "Sliding" : "Swing"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Measurements (inches)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {style.widths.map((wl, i) => (
                        <label key={i} className="block"><span className="block text-[11px] text-slate-500 mb-1">{wl}</span>
                          <input type="number" min={0} value={e.widthsIn[i] ?? 0} onChange={(ev) => setWidth(e.id, i, parseFloat(ev.target.value) || 0)} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
                      ))}
                      <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Height</span>
                        <input type="number" min={0} value={e.heightIn} onChange={(ev) => update(e.id, { heightIn: parseFloat(ev.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Measure the opening as closely as you can — the shop will confirm on site.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Thickness</span>
                      <select value={e.thickness} onChange={(ev) => update(e.id, { thickness: ev.target.value as GlassThickness })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">{THICKNESSES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                    <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Glass</span>
                      <select value={e.glass} onChange={(ev) => update(e.id, { glass: ev.target.value as GlassType })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm capitalize">{GLASS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
                    <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Finish</span>
                      <select value={e.finish} onChange={(ev) => update(e.id, { finish: ev.target.value as Finish })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">{FINISHES.map((fn) => <option key={fn.id} value={fn.id}>{fn.name}</option>)}</select></label>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <ShowerDrawing cfg={e} />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">Preview — your shop confirms exact glass sizes.</p>
                </div>
              </div>
            </div>
          );
        })}

        <button onClick={add} className="w-full rounded-lg border border-emerald-300 text-emerald-700 font-medium px-3 py-2.5 text-sm hover:bg-emerald-50">+ Add another enclosure</button>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Your details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Your name *</span><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
            <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Project / address</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Master bath" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
            <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
            <label className="block"><span className="block text-[11px] text-slate-500 mb-1">Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></label>
          </div>
          {err && <p className="text-sm text-red-500 mt-3">{err}</p>}
          <button onClick={submit} disabled={submitting} className="w-full mt-4 rounded-lg bg-emerald-600 text-white font-semibold py-3 text-sm hover:bg-emerald-700 disabled:opacity-60">{submitting ? "Sending…" : "Send my request"}</button>
          <p className="text-[11px] text-slate-400 mt-2 text-center">No account needed. {brand.name} will follow up with a quote.</p>
        </div>
      </main>
    </div>
  );
}
