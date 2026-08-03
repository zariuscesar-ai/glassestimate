"use client";

import { useState } from "react";
import { ArrowRight, Layers, Ruler, Calculator, Star, Store, ShowerHead, Check } from "lucide-react";
import Link from "next/link";

type Service = "flat" | "shower" | "bundle";

const services: { id: Service; icon: React.ReactNode; title: string; desc: string; price: string; priceNote: string; features: string[] }[] = [
  {
    id: "flat",
    icon: <Store className="h-6 w-6" />,
    title: "Flat Glass & Storefronts",
    desc: "Estimate storefronts, curtain walls, office partitions, doors, sidelites & transoms.",
    price: "$49",
    priceNote: "/month",
    features: ["Photo-based visual estimator", "All systems & enclosure layouts", "Instant pricing & proposals"],
  },
  {
    id: "shower",
    icon: <ShowerHead className="h-6 w-6" />,
    title: "Shower Glass",
    desc: "Estimate frameless showers, sliding doors, neo-angle enclosures & steam units.",
    price: "$49",
    priceNote: "/month",
    features: ["7 popular shower styles", "Glass type, hardware & finish", "Itemized pricing breakdown"],
  },
  {
    id: "bundle",
    icon: <Layers className="h-6 w-6" />,
    title: "Both — Flat + Shower",
    desc: "Everything in one platform. Storefronts in the morning, showers in the afternoon.",
    price: "$79",
    priceNote: "/month",
    features: ["Everything in Flat + Shower", "Multi-item projects", "Save $19/month"],
  },
];

export default function LandingPage() {
  const [selected, setSelected] = useState<Service>("bundle");

  const plan = services.find((s) => s.id === selected)!;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl">
            <Layers className="h-6 w-6 text-blue-600" />
            GlassEstimate
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href={`/signup?plan=${selected}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with Service Selector */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent" />
        <div className="container relative pt-20 pb-12 md:pt-28 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Built for small glass shops &amp; solo contractors
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Close glass jobs{" "}
              <span className="text-blue-600">on the first visit</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Photograph the opening, draw the system, show the client a realistic render,
              and hand them a priced proposal to sign — all in one visit.
            </p>
          </div>

          {/* Service Selector Cards */}
          <div className="mt-12 mx-auto max-w-4xl">
            <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">
              Choose your service:
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((s) => {
                const isActive = selected === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`relative text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                      isActive
                        ? "border-blue-600 bg-blue-50/50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {s.id === "bundle" && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                        Best value
                      </span>
                    )}
                    <div
                      className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                        isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {s.desc}
                    </p>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900">{s.price}</span>
                      <span className="text-sm text-muted-foreground">{s.priceNote}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isActive && (
                      <div className="mt-3 flex justify-end">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                          Selected <Check className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/signup?plan=${selected}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start 7-day free trial <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium hover:bg-gray-50 transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {selected === "bundle"
              ? "Save $19/mo with the bundle · "
              : ""}
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-gray-50/50">
        <div className="container py-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by glass shops across the country
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            <span className="text-lg font-bold text-gray-400">CRL Partners</span>
            <span className="text-lg font-bold text-gray-400">AGC Member Shops</span>
            <span className="text-lg font-bold text-gray-400">NGA Certified</span>
            <span className="text-lg font-bold text-gray-400">GANA Members</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From driveway to deal in four steps
            </h2>
            <p className="mt-4 text-muted-foreground">
              No more measuring, driving back to the office, and emailing a quote two days
              later while the client shops around.
            </p>
          </div>
          <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-4">
            {howItWorks.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a glass shop needs to quote and close
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for glazing — not a generic contractor CRM with glass bolted on.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start with a 7-day free trial. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </div>
          <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.featured
                    ? "border-blue-600 ring-2 ring-blue-600 shadow-lg relative"
                    : "hover:shadow-md transition-shadow"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Best Value
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?plan=${plan.planId}`}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20 md:py-28">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Close more jobs by not giving them time to shop around
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Every day between the site visit and the quote is a day the customer collects
            other bids. GlassEstimate collapses that gap to minutes. Start your free 7-day
            trial today.
          </p>
          <div className="mt-8">
            <Link
              href={`/signup?plan=${selected}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Start free trial <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <Layers className="h-5 w-5 text-blue-600" />
            GlassEstimate
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GlassEstimate. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const howItWorks = [
  {
    title: "Snap",
    description:
      "Take a photo of the opening or bathroom right on site with your iPad or phone.",
  },
  {
    title: "Draw",
    description:
      "Enter dimensions and draw the layout — doors, panels, enclosures, or shower style.",
  },
  {
    title: "Show",
    description:
      "The app renders a realistic preview so the client sees exactly what they're buying.",
  },
  {
    title: "Sign",
    description:
      "The estimate builds itself. Present the price, send the proposal, get the signature on the spot.",
  },
];

const features = [
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Photo-Based Visual Estimator",
    description:
      "Draw directly on a site photo. What you sketch becomes the estimate — no double entry.",
  },
  {
    icon: <Ruler className="h-6 w-6" />,
    title: "System-Aware Renders",
    description:
      "Frameless, framed, storefront, curtain wall, and 7 shower styles — each renders with the right hardware and finish.",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Enclosure & Shower Layouts",
    description:
      "Flat walls, L-shapes, C/U enclosures, bypass doors, neo-angle showers — all configured and priced automatically.",
  },
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Instant, Editable Pricing",
    description:
      "Your rates by system and labor, live totals, and tax — every change re-prices on the spot.",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Proposals & E-Signature",
    description:
      "Branded proposals with the render attached, sent and signed on site to close the sale in one visit.",
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: "Multi-Item Projects",
    description:
      "Group multiple storefronts, partitions, and showers under one project — one proposal, one signature.",
  },
];

const plans = [
  {
    planId: "flat",
    name: "Flat Glass",
    price: "$49",
    features: [
      "Photo-based visual estimator",
      "All systems & enclosure layouts",
      "Doors, sidelites & transoms",
      "Instant pricing & branded proposals",
      "E-signature & invoicing",
      "Works on iPad",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    planId: "bundle",
    name: "Flat + Shower",
    price: "$79",
    features: [
      "Everything in Flat Glass",
      "Everything in Shower Glass",
      "7 shower styles supported",
      "Multi-item project support",
      "Hardware & finish configurator",
      "Save $19/month",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    planId: "shower",
    name: "Shower Glass",
    price: "$49",
    features: [
      "7 popular shower styles",
      "Glass type & thickness options",
      "Hardware finish configurator",
      "Notch & cutout pricing",
      "Itemized pricing breakdown",
      "Works on iPad",
    ],
    cta: "Start free trial",
    featured: false,
  },
];
