'use client';

// Public proposal signing page (no login). The dealer sends this link; the
// client reviews the branded proposal + agreement and signs from any device.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProposalDocument, { type ProposalInvoice, type ProposalCompany } from '@/components/ProposalDocument';

export default function PublicProposalPage() {
  const params = useParams<{ token: string }>();
  const [inv, setInv] = useState<ProposalInvoice | null>(null);
  const [company, setCompany] = useState<ProposalCompany>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/proposal/${params.token}`);
      if (!res.ok) { setNotFound(true); return; }
      const d = await res.json();
      setInv(d.invoice); setCompany(d.company || {});
    } catch { setNotFound(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params.token]);

  const onSign = async (d: { signature_data: string; signed_by: string }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/proposal/${params.token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
      });
      if (res.ok) { await load(); }
      else alert((await res.json().catch(() => ({}))).error || 'Could not submit your signature.');
    } catch { alert('Could not submit your signature.'); } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading proposal…</div>;
  if (notFound || !inv) return <div className="min-h-screen flex items-center justify-center text-slate-500">This proposal link is not available.</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      {inv.signed_at && (
        <div className="no-print max-w-3xl mx-auto mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 text-center">
          ✓ Thank you — your acceptance was recorded on {new Date(inv.signed_at).toLocaleString()}. You can print or save a copy below.
        </div>
      )}
      <div className="max-w-3xl mx-auto mb-3 no-print text-right">
        <button onClick={() => window.print()} className="text-sm text-slate-500 hover:text-slate-700">🖨 Print / Save PDF</button>
      </div>
      <ProposalDocument inv={inv} company={company} onSign={inv.signed_at ? undefined : onSign} busy={busy} />
      <p className="text-center text-[11px] text-slate-400 mt-6 no-print">Secured proposal · {company.name || ''}</p>
    </div>
  );
}
