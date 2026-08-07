"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reset password.");
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter and confirm your new password.</p>
        </div>
        {!token ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-3">This reset link is invalid or has expired.</div>
            <Link href="/forgot-password" className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline">Request a new link</Link>
          </div>
        ) : done ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-3">Password updated. Redirecting you to sign in...</div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input type={showPw ? "text" : "password"} required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Re-enter your password" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetForm />
    </Suspense>
  );
}
