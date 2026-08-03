import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GlassEstimate — Close glass jobs on the first visit",
  description:
    "Photograph the opening, draw the system, show the client a realistic render, and hand them a priced proposal to sign — all in one visit. Built for small glass shops & solo contractors.",
  keywords: ["glass estimation software", "shower glass estimator", "storefront estimator", "glazing software", "glass shop software"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://glassestimate.app"),
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
