'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface Me {
  user: { id: number; name: string; email: string; role: string };
  company: { id: number; name: string } | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDark(true);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setMe(d))
      .catch(() => { router.push('/login'); });
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  const nav = [
    { href: '/', label: 'Dashboard', icon: '◫' },
    { href: '/clients', label: 'Clients', icon: '👥' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/invoices', label: 'Invoices', icon: '📄' },
    { href: '/estimates', label: 'Estimates', icon: '📋' },
    { href: '/jobs', label: 'Projects', icon: '🔧' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/visual-estimator', label: 'Flat Glass Estimator', icon: '🎨' },
    { href: '/showers', label: 'Shower Estimator', icon: '🚿' },
    { href: '/shape-calculator', label: 'Shape Calculator', icon: '📐' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <aside className="no-print w-64 h-screen bg-navy-900 text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-navy-700">
        <h1 className="text-sm font-bold tracking-tight opacity-80">Eagles Glass Manager</h1>
        <p className="text-xs text-slate-400 mt-1 truncate">{me?.company?.name || '…'}</p>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map((item) => {
          const active = isActive(item.href);
          const green = item.href === '/showers';
          const cls = green
            ? (active ? 'bg-emerald-600 text-white font-medium' : 'text-emerald-300 hover:bg-emerald-800/50 hover:text-white')
            : (active ? 'bg-navy-700 text-white font-medium' : 'text-slate-300 hover:bg-navy-800 hover:text-white');
          return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${cls}`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-navy-700 space-y-2">
        {me?.user && (
          <div className="text-xs text-slate-400 truncate" title={me.user.email}>
            {me.user.name || me.user.email}
          </div>
        )}
        <div className="flex items-center justify-between">
          <button onClick={logout} className="text-xs text-slate-300 hover:text-white underline-offset-2 hover:underline">
            Log out
          </button>
          <button onClick={toggleTheme} className="text-sm hover:scale-110 transition-transform" title={dark ? 'Switch to light' : 'Switch to dark'}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          <span className="text-slate-700">·</span>
          <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
          <span className="text-slate-700">·</span>
          <Link href="/disclaimer" className="hover:text-slate-300">Disclaimer</Link>
        </div>
        <div className="text-[10px] text-slate-600">SaaS v2.1</div>
      </div>
    </aside>
  );
}
