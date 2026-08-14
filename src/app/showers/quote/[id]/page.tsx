"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SHOWER_STYLES, FINISHES, HANDLE_TYPES, TOWEL_BAR_TYPES } from "@/lib/shower/types";
import type { EnclosureConfig, RateTable } from "@/lib/shower/types";
import { priceEnclosure } from "@/lib/shower/pricing";
import { DEFAULT_SHOWER_RATES } from "@/lib/shower/rates";
import { layoutEnclosure, formatDim, panelSizeLabel, planIsInformative, ponyWallRows, hardwareRows, slidingExtras, type GlassPanel } from "@/lib/shower/glass";
import ShowerDrawing from "@/components/ShowerDrawing";
import ShowerPlan from "@/components/ShowerPlan";

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

function cutoutSummary(c: EnclosureConfig): string {
  const cu = c.cutouts || { handleHoles: 0, hingeCutouts: 0, notches: 0, towelBars: 0 };
  const parts: string[] = [];
  const handle = HANDLE_TYPES.find((h) => h.id === c.handleType);
  if (handle) parts.push(handle.name);
  const towel = TOWEL_BAR_TYPES.find((t) => t.id === c.towelBarType);
  if (towel && towel.id !== "none") parts.push(towel.name);
  if (cu.hingeCutouts) parts.push(`${cu.hingeCutouts} hinge cutout${cu.hingeCutouts > 1 ? "s" : ""}`);
  if (cu.handleHoles) parts.push(`${cu.handleHoles} handle hole${cu.handleHoles > 1 ? "s" : ""}`);
  if (cu.notches) parts.push(`${cu.notches} notch${cu.notches > 1 ? "es" : ""}`);
  if (cu.towelBars && !towel) parts.push(`${cu.towelBars} towel bar${cu.towelBars > 1 ? "s" : ""}`);
  if (c.extraHandles) parts.push(`${c.extraHandles} extra handle${c.extraHandles > 1 ? "s" : ""}`);
  return parts.join(", ");
}

const panelSize = (p: GlassPanel) => (p.square ? `${formatDim(p.wTop)} × ${formatDim(p.hLeft)}` : panelSizeLabel(p));

// Plain-text glass order the dealer or client can email to the fabricator/shop.
function orderText(est: Est, company: Company | null): string {
  const L: string[] = [];
  L.push(`GLASS ORDER — ${est.project_name || "Shower enclosure"}${est.client_name ? ` (client: ${est.client_name})` : ""}`);
  if (company?.name) L.push(`Shop: ${company.name}`);
  L.push(`Ref: SHR-${est.id}`);
  L.push("");
  (est.enclosures || []).forEach((c, i) => {
    const style = SHOWER_STYLES.find((s) => s.id === c.style);
    const finish = FINISHES.find((f) => f.id === c.finish);
    L.push(`${c.label || "Enclosure " + (i + 1)} — ${style ? style.name : ""} — ${c.thickness} ${c.glass}${finish ? `, ${finish.name}` : ""}`);
    layoutEnclosure(c).panels.forEach((p) => L.push(`   ${p.label}: ${panelSize(p)}`));
    slidingExtras(c).forEach((r) => L.push(`   ${r.label}: ${r.size}`));
    ponyWallRows(c).forEach((r) => L.push(`   ${r.label}: ${r.size}`));
    const hwr = hardwareRows(c);
    if (hwr.length) { L.push(`   Hardware holes & clamps:`); hwr.forEach((r) => L.push(`     ${r.label}: ${r.size}`)); }
    const cs = cutoutSummary(c);
    if (cs) L.push(`   Cutouts/hardware: ${cs}`);
    L.push("");
  });
  L.push("Sizes are finished glass sizes (shop gaps applied). Please confirm before cutting.");
  return L.join("\n");
}

interface Est { id: number; project_name: string; client_name: string; enclosures: EnclosureConfig[]; markup_pct: number; tax_pct: number; created_at: string; }
interface Company { name: string; logo: string; address: string; phone: string; email: string; website: string; default_terms: string; default_notes: string; shower_rates?: RateTable; }

export default function QuotePage({ params }: { params: { id: string } }) {
  const [est, setEst] = useState<Est | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<"quote" | "order">("quote");

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
  const mailHref = `mailto:?subject=${encodeURIComponent(`Glass order — ${est.project_name || "Shower"} (SHR-${est.id})`)}&body=${encodeURIComponent(orderText(est, company))}`;

  const tab = (v: "quote" | "order", label: string) => (
    <button onClick={() => setView(v)} className={"px-3 py-2 text-sm " + (view === v ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>{label}</button>
  );

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: "@media print{.no-print{display:none!important}aside{display:none!important}.quote-sheet{box-shadow:none!important;border:none!important;margin:0!important}.avoid-break{break-inside:avoid}}" }} />

      <div className="no-print flex items-center justify-between mb-4 max-w-3xl mx-auto gap-3 flex-wrap">
        <Link href={"/showers?id=" + est.id} className="text-sm text-emerald-700 hover:underline">&larr; Back to estimate</Link>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">{tab("quote", "Customer quote")}{tab("order", "Shop order")}</div>
          {view === "order" && <a href={mailHref} className="rounded-lg border border-emerald-300 text-emerald-700 font-medium px-3 py-2 text-sm hover:bg-emerald-50">✉ Email order</a>}
          <button onClick={() => window.print()} className="rounded-lg bg-emerald-600 text-white font-medium px-4 py-2 text-sm hover:bg-emerald-700">Print / Save as PDF</button>
        </div>
      </div>

      {/* ---------------- CUSTOMER QUOTE ---------------- */}
      {view === "quote" && (
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
      )}

      {/* ---------------- SHOP ORDER / CUT SHEET ---------------- */}
      {view === "order" && (
        <div className="quote-sheet max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {company?.logo ? <img src={company.logo} alt="" className="h-14 w-14 object-contain" /> : null}
              <div>
                <div className="text-lg font-bold text-slate-900">{company?.name || "Your Company"}</div>
                <div className="text-xs text-slate-500">{[company?.phone, company?.email].filter(Boolean).join("  ·  ")}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight text-emerald-700">GLASS ORDER</div>
              <div className="text-xs text-slate-500 mt-1">Ref #SHR-{est.id}</div>
              <div className="text-xs text-slate-500">{dateStr}</div>
            </div>
          </div>

          <div className="flex justify-between mb-6 text-sm">
            <div><div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Client</div><div className="text-slate-800 font-medium">{est.client_name || "—"}</div></div>
            <div className="text-right"><div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Project</div><div className="text-slate-800 font-medium">{est.project_name || "Shower enclosure"}</div></div>
          </div>

          {(est.enclosures || []).map((c, i) => {
            const style = SHOWER_STYLES.find((s) => s.id === c.style);
            const finish = FINISHES.find((f) => f.id === c.finish);
            const panels = layoutEnclosure(c).panels;
            const cs = cutoutSummary(c);
            const oos = !!c.measure?.outOfSquare;
            return (
              <div key={i} className="avoid-break mb-8">
                <div className="flex items-baseline justify-between border-b border-slate-200 pb-1 mb-3">
                  <div className="font-semibold text-slate-800">{c.label || "Enclosure " + (i + 1)}</div>
                  <div className="text-xs text-slate-500">{style ? style.name : ""} · {c.thickness} {c.glass}{finish ? ` · ${finish.name}` : ""}{oos ? " · out of square" : ""}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><ShowerDrawing cfg={c} /></div>
                    {planIsInformative(c) ? <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2"><ShowerPlan cfg={c} /></div> : null}
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-[11px] text-slate-500 uppercase"><th className="py-1 font-semibold">Panel</th><th className="py-1 font-semibold">Glass size</th></tr></thead>
                      <tbody>
                        {panels.map((p, pi) => (
                          <tr key={pi} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-slate-700 whitespace-nowrap">{p.label}</td>
                            <td className="py-1.5 font-medium text-slate-900">{panelSize(p)}</td>
                          </tr>
                        ))}
                        {slidingExtras(c).map((r, ri) => (
                          <tr key={"sx" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-sky-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 text-slate-600 text-xs">{r.size}</td>
                          </tr>
                        ))}
                        {ponyWallRows(c).map((r, ri) => (
                          <tr key={"pw" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-emerald-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 font-medium text-slate-900">{r.size}</td>
                          </tr>
                        ))}
                        {hardwareRows(c).map((r, ri) => (
                          <tr key={"hw" + ri} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 text-violet-700 whitespace-nowrap">{r.label}</td>
                            <td className="py-1.5 text-slate-600 text-xs">{r.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cs ? <p className="text-xs text-slate-500 mt-2"><span className="font-medium text-slate-600">Cutouts/hardware:</span> {cs}</p> : null}
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">Sizes are finished glass sizes with shop gaps applied — ready to cut. Please confirm measurements before fabrication.</p>
        </div>
      )}
    </div>
  );
}
