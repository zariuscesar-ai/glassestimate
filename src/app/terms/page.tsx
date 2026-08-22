import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — GlassEstimate',
  description: 'The terms governing your use of GlassEstimate, operated by Eagles Glass Inc.',
};

const UPDATED = 'August 22, 2026';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to GlassEstimate</Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Terms of Service</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: {UPDATED}</p>
        </div>

        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px]">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) are a legal agreement between you and
            <strong> Eagles Glass Inc</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
            the operator of GlassEstimate (the &ldquo;Service&rdquo;). By creating an account or using
            the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. The Service</h2>
            <p>GlassEstimate provides software tools that help glass and glazing businesses build estimates and quotes, manage clients and products, and create invoices and proposals. The Service is a tool for your business; it does not perform work, provide professional advice, or act on your behalf with your customers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Accounts</h2>
            <p>You must provide accurate information and are responsible for all activity under your account and for keeping your login credentials secure. You must be at least 18 and authorized to act for your business. Notify us promptly of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Subscriptions, billing, and cancellation</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Paid plans are billed on a recurring monthly basis through our payment processor, Stripe, and <strong>renew automatically</strong> until canceled.</li>
              <li>You can cancel at any time from your billing settings; cancellation takes effect at the end of the current billing period, and you keep access until then.</li>
              <li>Except where required by law, payments are non-refundable, including for partial billing periods.</li>
              <li>We may change plan prices with advance notice. Any &ldquo;founding&rdquo; or promotional price applies only as described at the time you subscribe.</li>
              <li>If a payment fails or a subscription lapses, access to paid features may be suspended until payment is resolved.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Acceptable use</h2>
            <p>You agree not to misuse the Service, including by: using it unlawfully; attempting to access other accounts or data; reverse engineering, copying, or reselling the Service; overburdening or disrupting our systems; or uploading unlawful or infringing content.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Your data and your customers</h2>
            <p>You retain ownership of the data and content you enter. You grant us a limited license to host and process it solely to provide the Service. <strong>You are solely responsible for the accuracy of your inputs and rates, and for any estimate, quote, price, proposal, or contract you provide to your own customers.</strong> The Service produces estimates from the information you enter; it does not set prices for you or guarantee any result. See our <Link href="/disclaimer" className="text-blue-600 hover:underline">Disclaimer</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Intellectual property</h2>
            <p>The Service, including its software, design, and content (other than your data), is owned by Eagles Glass Inc and protected by law. These Terms do not grant you any ownership of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Disclaimer of warranties</h2>
            <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, error-free, or that any estimate or calculation it produces is accurate or complete.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Limitation of liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, EAGLES GLASS INC WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST BIDS, LOST REVENUE, OR BUSINESS LOSSES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE AMOUNT YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Eagles Glass Inc from claims, damages, and costs arising out of your use of the Service, your data, or your dealings with your own customers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">10. Suspension and termination</h2>
            <p>We may suspend or terminate access if you violate these Terms or to protect the Service. You may stop using the Service and cancel at any time. Sections that by their nature should survive termination (such as payment obligations, disclaimers, and limitations of liability) will survive.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">11. Governing law</h2>
            <p>These Terms are governed by the laws of the State of Texas, without regard to its conflict-of-laws rules. You agree that the state and federal courts located in Texas will have exclusive jurisdiction over any dispute arising from these Terms or the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">12. Changes to these Terms</h2>
            <p>We may update these Terms from time to time. We will revise the &ldquo;Last updated&rdquo; date above, and material changes may be communicated in the app or by email. Continued use after a change means you accept the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">13. Contact</h2>
            <p>Questions about these Terms? Email <a href="mailto:support@glassestimates.app" className="text-blue-600 hover:underline">support@glassestimates.app</a>.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 text-sm text-slate-500">
          <span className="mr-4"><Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
          <span className="mr-4"><Link href="/disclaimer" className="text-blue-600 hover:underline">Disclaimer</Link></span>
          <span>&copy; 2026 Eagles Glass Inc</span>
        </div>
      </div>
    </main>
  );
}
