"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-1">We will email you a link to set a new one.</p>
        </div>
        {submitted ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-3">
              If an account exists for <strong>{email}</strong>, we have sent a password-reset link. Check your inbox — the link expires in 1 hour.
            </div>
            <Link href="/login" className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@company.com" autoComplete="email" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700 disabled:opacity-60">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-4">
              Remembered it? <Link href="/login" className="text-blue-600 font-medium hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
