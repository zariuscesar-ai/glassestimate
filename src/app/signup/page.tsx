"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, ArrowLeft, Loader2, Check } from "lucide-react";
import { signIn } from "next-auth/react";

const planInfo: Record<string, { name: string; price: string; features: string[] }> = {
  flat: {
    name: "Flat Glass & Storefronts",
    price: "$49/mo",
    features: ["Photo-based visual estimator", "All systems & enclosure layouts", "Instant pricing & proposals"],
  },
  shower: {
    name: "Shower Glass",
    price: "$49/mo",
    features: ["7 popular shower styles", "Glass type & hardware config", "Itemized pricing breakdown"],
  },
  bundle: {
    name: "Flat + Shower Bundle",
    price: "$79/mo",
    features: ["Everything in Flat + Shower", "Multi-item projects", "Save $19/month"],
  },
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "bundle";
  const plan = planInfo[planId] || planInfo.bundle;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      action: "signup",
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Layers className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold">GlassEstimate</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Start your 7-day free trial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            No credit card required · Cancel anytime
          </p>
        </div>

        {/* Selected plan card */}
        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">{plan.name}</span>
            <span className="text-lg font-bold text-blue-700">{plan.price}</span>
          </div>
          <ul className="space-y-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-1.5 text-xs text-blue-800">
                <Check className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-center">
            <Link
              href="/#services"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Change plan
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSignup}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="jane@lawfirm.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Min 8 characters"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Start free trial"
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>

        <Link
          href="/"
          className="flex items-center justify-center gap-1 mt-6 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
