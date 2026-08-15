"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const PLANS = [
  { id: "showers", name: "Showers", price: "$49/mo", desc: "Shower enclosure estimates" },
  { id: "both", name: "Both", price: "$79/mo", desc: "Showers + flat glass — best value" },
  { id: "flat", name: "Flat Glass", price: "$49/mo", desc: "Interior glass & storefronts" },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("plan") || "";
  const [plan, setPlan] = useState(["showers", "flat", "both"].includes(q) ? q : "both");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign up failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create your shop</h1>
          <p className="text-slate-500 text-sm mt-1">Founding price locked in for 2 years &mdash; no card required today.</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Choose your plan</label>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button type="button" key={p.id} onClick={() => setPlan(p.id)}
                  className={"rounded-lg border px-2 py-2 text-center " + (plan === p.id ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50" : "border-slate-300 hover:border-slate-400")}>
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.price}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{PLANS.find((p) => p.id === plan)?.desc}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
            <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Acme Glass & Mirror" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Jane Doe" autoComplete="name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@company.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="At least 8 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-700">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Creating…" : "Claim founding price"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}
