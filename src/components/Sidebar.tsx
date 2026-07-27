'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface Company { id: number; name: string; slug: string; }

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number>(1);

  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
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
    fetch('/api/companies').then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : [])).catch(() => {});
    const saved = localStorage.getItem('activeCompanyId');
    if (saved) setActiveCompanyId(parseInt(saved));
  }, []);

  const switchCompany = (id: number) => {
    setActiveCompanyId(id);
    localStorage.setItem('activeCompanyId', String(id));
    router.refresh();
  };

  const nav = [
    { href: '/', label: 'Dashboard', icon: '◫' },
    { href: '/clients', label: 'Clients', icon: '👥' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/invoices', label: 'Invoices', icon: '📄' },
    { href: '/estimates', label: 'Estimates', icon: '📋' },
    { href: '/jobs', label: 'Jobs', icon: '🔧' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/visual-estimator', label: 'Visual Estimator', icon: '🎨' },
    { href: '/shape-calculator', label: 'Shape Calculator', icon: '📐' },
    { href: '/reports', label: 'Reports', icon: '📊' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ];

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="no-print w-64 h-screen bg-navy-900 text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="px-4 py-4 border-b border-navy-700">
        <h1 className="text-sm font-bold tracking-tight opacity-80 mb-2">Eagles Glass Manager</h1>
        <select
          className="w-full rounded-lg bg-navy-800 text-white text-xs px-3 py-2 border border-navy-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={activeCompanyId}
          onChange={(e) => switchCompany(parseInt(e.target.value))}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href) ? 'bg-navy-700 text-white font-medium' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-navy-700 flex items-center justify-between">
        <span className="text-xs text-slate-500">SaaS v2.0</span>
        <button onClick={toggleTheme} className="text-sm hover:scale-110 transition-transform" title={dark ? 'Switch to light' : 'Switch to dark'}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </aside>
  );
}
