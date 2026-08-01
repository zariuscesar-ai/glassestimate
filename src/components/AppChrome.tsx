'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

// Auth pages render full-width with no app chrome; everything else gets the
// sidebar + main layout.
const BARE_PREFIXES = ['/login', '/signup'];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const bare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (bare) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 bg-slate-50 min-h-screen transition-colors">
        {children}
      </main>
    </div>
  );
}
