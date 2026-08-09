"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SHOWER_STYLES, FINISHES } from "@/lib/shower/types";
import type { EnclosureConfig, RateTable } from "@/lib/shower/types";
import { priceEnclosure } from "@/lib/shower/pricing";
import { DEFAULT_SHOWER_RATES } from "@/lib/shower/rates";

const money = (n: number) => "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (n: number) => Math.round(n * 100) / 100;

function describe(c: EnclosureConfig): string {
  const style = SHOWER_STYLES.find((s) => s.id === c.style);
  const finish = FINISHES.find((f) => f.id === c.finish);
  const dims = (c.widthsIn || []).filter((w) => w > 0).map((w) => w + '"').join(" + ");
  const parts: string[] = [];
  parts.push(style ? style.name : "Enclosure");
  if (dims) parts.push(dims + " W x " + (c.heightIn || 0) + '" H');
  parts.push(((c.thickness || "") + " " + (c.glass || "")).trim());
  if (finish) parts.push(finish.name);
  const cu = c.cutouts || { handleHoles: 0, hingeCutouts: 0, notches: 0, towelBars: 0 };
  const addons: string[] = [];
  if (cu.towelBars) addons.push(cu.towelBars + " towel bar" + (cu.towelBars > 1 ? "s" : ""));
  if (c.extraHandles) addons.push(c.extraHandles + " extra handle" + (c.extraHandles > 1 ? "s" : ""));
  if (cu.notches) addons.push(cu.notches + " notch" + (cu.notches > 1 ? "es" : ""));
  let s = parts.join(" · ");
  if (addons.length) s += " (" + addons.join(", ") + ")";
  return s;
}

interface Est { id: number; project_name: string; client_name: string; enclosures: EnclosureConfig[]; markup_pct: number; tax_pct: number; created_at: string; }
interface Company { name: string; logo: string; address: string; phone: string; email: string; website: string; default_terms: string; default_notes: string; shower_rates?: RateTable; }

export default function QuotePage({ params }: { params: { id: string } }) {
  const [est, setEst] = useState<Est | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/shower-estimates/" + params.id).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/companies").then((r) => (r.ok ? r.json() : [])),
    ]).then(([e, list]) => {
      if (!e || !e.id) { setNotFound(true); return; }
      setEst(e);
      setCompany(Array.isArray(list) ? list[0] : null);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-slate-400 py-16 text-center">Loading quote...</div>;
  if (notFound || !est) return <div className="py-16 text-center text-slate-400">Estimate not found. <Link href="/showers/saved" className="text-emerald-700 hover:underline">Back to saved</Link></div>;

  const rates: RateTable = company?.shower_rates || DEFAULT_SHOWER_RATES;
  const markup = 1 + (est.markup_pct || 0) / 100;
  const lines = (est.enclosures || []).map((c, i) => ({ key: i, desc: describe(c), amount: r2(priceEnclosure(c, rates).subtotal * markup) }));
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  const taxAmt = r2((subtotal * (est.tax_pct || 0)) / 100);
  const total = r2(subtotal + taxAmt);
  const dateStr = (est.created_at || "").slice(0, 10);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: "@media print{.no-print{display:none!important}aside{display:none!important}.quote-sheet{box-shadow:none!important;border:none!important;margin:0!important}}" }} />

      <div className="no-print flex items-center justify-between mb-4 max-w-3xl mx-auto">
        <Link href={"/showers?id=" + est.id} className="text-sm text-emerald-700 hover:underline">&larr; Back to estimate</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-emerald-600 text-white font-medium px-4 py-2 text-sm hover:bg-emerald-700">Print / Save as PDF</button>
      </div>

      <div className="quote-sheet max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            {company?.logo ? <img src={company.logo} alt="" className="h-14 w-14 object-contain" /> : null}
            <div>
              <div className="text-lg font-bold text-slate-900">{company?.name || "Your Company"}</div>
              {company?.address ? <div className="text-xs text-slate-500 whitespace-pre-line">{company.address}</div> : null}
              <div className="text-xs text-slate-500">{[company?.phone, company?.email].filter(Boolean).join("  ·  ")}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tracking-tight text-emerald-700">QUOTE</div>
            <div className="text-xs text-slate-500 mt-1">Quote #SHR-{est.id}</div>
            <div className="text-xs text-slate-500">{dateStr}</div>
          </div>
        </div>

        <div className="flex justify-between mb-6 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Prepared for</div>
            <div className="text-slate-800 font-medium">{est.client_name || "Customer"}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Project</div>
            <div className="text-slate-800 font-medium">{est.project_name || "Shower enclosure"}</div>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-b border-slate-100">
                <td className="py-3 pr-4 text-slate-700">{l.desc}</td>
                <td className="py-3 text-right font-medium text-slate-800 whitespace-nowrap">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax ({est.tax_pct || 0}%)</span><span>{money(taxAmt)}</span></div>
            <div className="flex justify-between border-t border-slate-300 pt-2 mt-1 text-base font-bold text-slate-900"><span>Total</span><span className="text-emerald-700">{money(total)}</span></div>
          </div>
        </div>

        {(company?.default_terms || company?.default_notes) ? (
          <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 whitespace-pre-line">
            {company?.default_notes ? <p className="mb-2">{company.default_notes}</p> : null}
            {company?.default_terms ? <p>{company.default_terms}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
