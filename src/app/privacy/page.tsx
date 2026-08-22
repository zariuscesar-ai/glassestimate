import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — GlassEstimate',
  description: 'How Eagles Glass Inc collects, uses, and protects your information on GlassEstimate.',
};

const UPDATED = 'August 22, 2026';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to GlassEstimate</Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: {UPDATED}</p>
        </div>

        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px]">
          <p>
            This Privacy Policy explains how <strong>Eagles Glass Inc</strong> (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects information when you
            use GlassEstimate (the &ldquo;Service&rdquo;) at glassestimate.app. By using the Service,
            you agree to this Policy.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account information</strong> — your name, email address, company name, and a password (which we store only as a salted, hashed value; we never store it in plain text).</li>
              <li><strong>Business and project data you enter</strong> — clients, products, rates, estimates, invoices, project details, drawings, and similar information you add to run your shop.</li>
              <li><strong>Payment information</strong> — handled entirely by our payment processor, Stripe. Card numbers are entered on Stripe and <strong>never touch our servers</strong>; we receive only limited details such as your subscription status and the last four digits of a card.</li>
              <li><strong>Technical information</strong> — a secure session cookie to keep you signed in, plus basic server logs (such as IP address and request times) used for security and reliability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">How we use your information</h2>
            <p>We use your information to provide and secure the Service, authenticate your account, process subscription billing, respond to support requests, and improve the product. We do <strong>not</strong> sell your personal information, and we do not use your business or customer data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Payments</h2>
            <p>Subscription payments are processed by <strong>Stripe, Inc.</strong> Your use of payment features is also subject to Stripe&rsquo;s privacy policy. Because Stripe handles card data directly, we are not able to see or store your full card number.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">How your data is stored and shared</h2>
            <p>Your data is stored with our infrastructure providers (including our hosting and database providers) under their security controls. We share information only with the service providers needed to operate the Service (such as Stripe for payments and our hosting/database providers), or when required by law. We never sell your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Data retention</h2>
            <p>We keep your account and business data for as long as your account is active. If you close your account or ask us to delete your data, we will delete or anonymize it within a reasonable period, except where we must retain records to comply with legal or tax obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Your choices and rights</h2>
            <p>You may access, correct, export, or request deletion of your personal information by emailing us at <a href="mailto:support@glassestimates.app" className="text-blue-600 hover:underline">support@glassestimates.app</a>. You can also cancel your subscription at any time from your billing settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Cookies</h2>
            <p>We use a single essential, signed session cookie to keep you logged in securely. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Children</h2>
            <p>The Service is intended for businesses and is not directed to anyone under 18. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Changes to this Policy</h2>
            <p>We may update this Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date above. Continued use of the Service after a change means you accept the updated Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact us</h2>
            <p>Questions about this Policy or your data? Email <a href="mailto:support@glassestimates.app" className="text-blue-600 hover:underline">support@glassestimates.app</a>.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 text-sm text-slate-500">
          <span className="mr-4"><Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></span>
          <span className="mr-4"><Link href="/disclaimer" className="text-blue-600 hover:underline">Disclaimer</Link></span>
          <span>&copy; 2026 Eagles Glass Inc</span>
        </div>
      </div>
    </main>
  );
}
