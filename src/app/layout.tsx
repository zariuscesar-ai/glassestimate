import type { Metadata } from 'next';
import './globals.css';
import AppChrome from '@/components/AppChrome';

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
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
