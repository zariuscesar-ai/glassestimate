"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row { id: number; project_name: string; client_name: string; total: number; updated_at: string; }
const money = (n: number) => "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SavedEstimatesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shower-estimates").then((r) => (r.ok ? r.json() : [])).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const del = async (id: number) => {
    await fetch("/api/shower-estimates/" + id, { method: "DELETE" }).catch(() => {});
    setRows((l) => l.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-xl">&#128703;</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Saved Shower Estimates</h1>
            <p className="text-sm text-slate-500">Open one to keep editing, or start a new quote.</p>
          </div>
        </div>
        <Link href="/showers" className="rounded-lg bg-emerald-600 text-white font-medium px-4 py-2.5 text-sm hover:bg-emerald-700">+ New estimate</Link>
      </div>

      {loading ? (
        <div className="text-slate-400 py-16 text-center">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          No saved estimates yet. <Link href="/showers" className="text-emerald-700 hover:underline">Create your first</Link>.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-emerald-50/40">
              <Link href={"/showers?id=" + r.id} className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{r.project_name || "Untitled project"}</div>
                <div className="text-xs text-slate-500 truncate">{r.client_name || "No client"} &middot; {r.updated_at ? r.updated_at.slice(0, 10) : ""}</div>
              </Link>
              <div className="flex items-center gap-4 pl-4">
                <span className="font-bold text-emerald-700">{money(r.total)}</span>
                <Link href={"/showers/quote/" + r.id} className="text-xs text-emerald-700 hover:underline">Quote</Link>
                <button onClick={() => del(r.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
