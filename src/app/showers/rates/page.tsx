"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { DEFAULT_SHOWER_RATES } from "@/lib/shower/rates";
import type { RateTable } from "@/lib/shower/types";
import { THICKNESSES, GLASS_TYPES, FINISHES } from "@/lib/shower/types";

function clone(r: RateTable): RateTable { return JSON.parse(JSON.stringify(r)) as RateTable; }

export default function ShowerRatesPage() {
  const [rates, setRatesState] = useState<RateTable>(clone(DEFAULT_SHOWER_RATES));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/companies").then((r) => (r.ok ? r.json() : [])).then((list) => {
      const c = Array.isArray(list) ? list[0] : null;
      if (c && c.shower_rates) setRatesState({ ...clone(DEFAULT_SHOWER_RATES), ...c.shower_rates });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/companies/1", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shower_rates: rates }),
      });
      if (!r.ok) throw new Error();
      setMsg("Saved.");
    } catch { setMsg("Could not save."); }
    finally { setSaving(false); }
  };

  const upd = (fn: (c: RateTable) => void) => setRatesState((r) => { const c = clone(r); fn(c); return c; });

  if (loading) return <div className="text-slate-400 py-16 text-center">Loading rates...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-xl">&#128703;</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shower Rates</h1>
            <p className="text-sm text-slate-500">Your rates for shower estimates. Edit anything &mdash; the estimator uses these.</p>
          </div>
        </div>
        <Link href="/showers" className="text-sm text-emerald-700 hover:underline">&larr; Back to estimator</Link>
      </div>

      <Section title="Glass - price per sq ft">
        {THICKNESSES.map((th) => (
          <div key={th} className="mb-3 last:mb-0">
            <div className="text-xs font-semibold text-slate-600 mb-1">{th} tempered</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GLASS_TYPES.map((t) => (
                <Field key={t} label={t} value={rates.glassPerSqft[th][t]} onChange={(n) => upd((c) => { c.glassPerSqft[th][t] = n; })} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Hardware - each">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Field label="Hinge / pivot" value={rates.hardware.hinge} onChange={(n) => upd((c) => { c.hardware.hinge = n; })} />
          <Field label="Handle / pull" value={rates.hardware.handle} onChange={(n) => upd((c) => { c.hardware.handle = n; })} />
          <Field label="Glass connector" value={rates.hardware.connector} onChange={(n) => upd((c) => { c.hardware.connector = n; })} />
          <Field label="Sliding kit" value={rates.hardware.slidingKit} onChange={(n) => upd((c) => { c.hardware.slidingKit = n; })} />
          <Field label="Header / channel" value={rates.hardware.headerPerFt} onChange={(n) => upd((c) => { c.hardware.headerPerFt = n; })} suffix="/ft" />
          <Field label="Towel bar" value={rates.hardware.towelBar} onChange={(n) => upd((c) => { c.hardware.towelBar = n; })} />
        </div>
      </Section>

      <Section title="Fabrication - each">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Field label="Handle / accessory hole" value={rates.fabrication.handleHole} onChange={(n) => upd((c) => { c.fabrication.handleHole = n; })} />
          <Field label="Hinge cutout" value={rates.fabrication.hingeCutout} onChange={(n) => upd((c) => { c.fabrication.hingeCutout = n; })} />
          <Field label="Corner / knee-wall notch" value={rates.fabrication.notch} onChange={(n) => upd((c) => { c.fabrication.notch = n; })} />
        </div>
      </Section>

      <Section title="Labor">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Field label="Install base (per enclosure)" value={rates.labor.installBase} onChange={(n) => upd((c) => { c.labor.installBase = n; })} />
          <Field label="Install per sq ft" value={rates.labor.installPerSqft} onChange={(n) => upd((c) => { c.labor.installPerSqft = n; })} suffix="/sqft" />
        </div>
      </Section>

      <Section title="Finish upcharge (on hardware)">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FINISHES.map((f) => (
            <Field key={f.id} label={f.name} value={rates.finishUpchargePct[f.id]} onChange={(n) => upd((c) => { c.finishUpchargePct[f.id] = n; })} prefix="" suffix="%" />
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 text-white font-medium px-5 py-2.5 text-sm hover:bg-emerald-700 disabled:opacity-60">{saving ? "Saving..." : "Save rates"}</button>
        <button onClick={() => setRatesState(clone(DEFAULT_SHOWER_RATES))} className="text-sm text-slate-500 hover:text-slate-700">Reset to defaults</button>
        {msg && <span className={"text-sm " + (msg.includes("not") ? "text-red-500" : "text-green-600")}>{msg}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-5 mb-4">
      <h2 className="text-sm font-semibold text-emerald-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, prefix = "$", suffix }: { label: string; value: number; onChange: (n: number) => void; prefix?: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-slate-500 mb-1 capitalize">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1.5 text-xs text-slate-400">{prefix}</span>}
        <input type="number" min={0} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={"w-full rounded-lg border border-slate-300 " + (prefix ? "pl-6 " : "pl-2 ") + (suffix ? "pr-8 " : "pr-2 ") + "py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"} />
        {suffix && <span className="absolute right-2 top-1.5 text-xs text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}
