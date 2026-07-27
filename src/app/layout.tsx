import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Eagles Glass — Business Manager',
  description: 'Client, product, invoice, estimate, and visual estimator for glass businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 bg-slate-50 min-h-screen transition-colors">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
