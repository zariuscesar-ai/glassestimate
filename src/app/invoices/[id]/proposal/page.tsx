'use client';

// Dealer's proposal + e-sign page. Open it, hand the device to the client to
// sign on-site, or copy a signing link to send. Also prints to PDF.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProposalDocument, { type ProposalInvoice, type ProposalCompany } from '@/components/ProposalDocument';

export default function ProposalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [inv, setInv] = useState<ProposalInvoice | null>(null);
  const [company, setCompany] = useState<ProposalCompany>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ri, rc] = await Promise.all([fetch(`/api/invoices/${params.id}`), fetch('/api/companies')]);
      if (ri.ok) setInv(await ri.json());
      if (rc.ok) { const cs = await rc.json(); setCompany(cs[0] || {}); }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params.id]);

  const onSign = async (d: { signature_data: string; signed_by: string }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
      });
      if (res.ok) setInv(await res.json());
      else alert((await res.json().catch(() => ({}))).error || 'Could not save the signature.');
    } catch { alert('Could not save the signature.'); } finally { setBusy(false); }
  };

  const makeLink = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/proposal-link`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json(); setLink(d.url);
        try { await navigator.clipboard.writeText(d.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
      }
    } catch { /* ignore */ }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading proposal…</div>;
  if (!inv) return <div className="p-8 text-slate-500">Proposal not found.</div>;

  return (
    <div className="py-2">
      <div className="no-print flex items-center justify-between mb-4 max-w-3xl mx-auto gap-2 flex-wrap">
        <button onClick={() => router.push(`/invoices/${params.id}`)} className="text-sm text-slate-500 hover:text-slate-700">← Back to estimate</button>
        <div className="flex gap-2">
          {!inv.signed_at && <button onClick={makeLink} className="btn-secondary btn-sm">{copied ? 'Link copied ✓' : '🔗 Copy signing link'}</button>}
          <button onClick={() => window.print()} className="btn-secondary btn-sm">🖨 Print / PDF</button>
        </div>
      </div>
      {link && !inv.signed_at && (
        <p className="no-print text-center text-xs text-slate-500 mb-3 max-w-3xl mx-auto break-all">
          Send this to your client to sign: <span className="text-navy-700 font-medium">{link}</span>
        </p>
      )}
      {!inv.signed_at && (
        <p className="no-print text-center text-xs text-slate-400 mb-3">Hand the device to your client to sign here, or send the link above.</p>
      )}
      <ProposalDocument inv={inv} company={company} onSign={inv.signed_at ? undefined : onSign} busy={busy} />
    </div>
  );
}
