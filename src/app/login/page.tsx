"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const OAUTH_ERRORS: Record<string, string> = {
  "google-no-account": "No GlassEstimate account uses that Google email. Sign in with your email and password, or create an account first.",
  "google-unconfigured": "Google sign-in is not set up yet. Use your email and password for now.",
  "google-cancelled": "Google sign-in was cancelled.",
  "google-state": "Google sign-in expired or was interrupted. Please try again.",
  "google-token": "Could not complete Google sign-in. Please try again.",
  "google-userinfo": "Could not read your Google profile. Please try again.",
  "google-email": "Your Google email is not verified, so it cannot be used to sign in.",
};

function GoogleButton({ next }: { next: string }) {
  const href = `/api/auth/google${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <a href={href}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      Continue with Google
    </a>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const oauthError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  const shownError = error || (oauthError ? OAUTH_ERRORS[oauthError] || "Sign-in failed. Please try again." : "");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">GlassEstimate</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your shop</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          {shownError && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{shownError}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@company.com" autoComplete="email" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Your password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-700">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">Or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleButton next={next} />
          <p className="text-center text-xs text-slate-400">Use the Google account that matches your login email.</p>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          New to GlassEstimate? <Link href="/signup" className="text-blue-600 font-medium hover:underline">Create your shop</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
