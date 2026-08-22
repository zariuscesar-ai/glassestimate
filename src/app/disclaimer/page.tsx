import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer — GlassEstimate',
  description: 'Important disclaimer about estimates and calculations produced by GlassEstimate.',
};

const UPDATED = 'August 22, 2026';

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to GlassEstimate</Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Disclaimer</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: {UPDATED}</p>
        </div>

        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px]">
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3">
            <strong>Estimates are estimates — not guaranteed quotes or final prices.</strong> GlassEstimate is a
            calculation tool. The numbers it produces depend entirely on the information and rates you enter, and are
            for your internal use in preparing your own quotes.
          </div>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Tool, not a guarantee</h2>
            <p>GlassEstimate, operated by <strong>Eagles Glass Inc</strong>, helps you build estimates faster. It calculates results from the measurements, options, and pricing <em>you</em> provide. It does not guarantee that any estimate, size, quantity, price, or total is accurate, complete, or suitable for a given job.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">You are responsible for verification</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All sizes shown are nominal and must be confirmed by <strong>field measurement</strong> before fabrication or ordering. Tempered glass cannot be altered once fabricated.</li>
              <li>You are responsible for verifying every measurement, deduction, quantity, material, labor rate, tax, and total before relying on it.</li>
              <li>You are solely responsible for the quotes, proposals, prices, and contracts you provide to your own customers, and for meeting any permit, code, safety, and licensing requirements that apply to your work.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No liability for reliance on outputs</h2>
            <p>To the fullest extent permitted by law, Eagles Glass Inc is not responsible or liable for any loss or damage arising from your use of, or reliance on, estimates or calculations produced by the Service — including pricing errors, underbidding or overbidding, lost bids, material or fabrication errors, or any resulting financial loss. The Service does not provide engineering, legal, or professional advice and does not replace your own professional judgment.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">&ldquo;As is&rdquo;</h2>
            <p>The Service and its outputs are provided &ldquo;as is,&rdquo; without warranties of any kind. Your use of the Service is also governed by our <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>, including the limitation of liability described there.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Questions</h2>
            <p>Contact us at <a href="mailto:support@glassestimates.app" className="text-blue-600 hover:underline">support@glassestimates.app</a>.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 text-sm text-slate-500">
          <span className="mr-4"><Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
          <span className="mr-4"><Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></span>
          <span>&copy; 2026 Eagles Glass Inc</span>
        </div>
      </div>
    </main>
  );
}
