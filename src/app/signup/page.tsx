'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Sign up failed');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create your shop</h1>
          <p className="text-slate-500 text-sm mt-1">Start estimating in minutes — your glass catalog is preloaded.</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
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
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 text-sm hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
