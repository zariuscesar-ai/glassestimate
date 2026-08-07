// Transactional email via the Brevo API. If BREVO_API_KEY is unset, sending is
// skipped and the message is logged so the flow stays testable without a provider.
interface SendArgs { to: string; subject: string; html: string; text?: string; }

// RESET_FROM_EMAIL may be "Name <email@x.com>" or just "email@x.com".
function parseFrom(): { name: string; email: string } {
  const raw = process.env.RESET_FROM_EMAIL || 'GlassEstimate <noreply@glassestimate.app>';
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || 'GlassEstimate', email: m[2].trim() };
  return { name: 'GlassEstimate', email: raw.trim() };
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn(`[email] BREVO_API_KEY not set; skipping send to ${to}. Subject: ${subject}`);
    if (text) console.warn(`[email] (dev) body:\n${text}`);
    return false;
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: parseFrom(),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[email] Brevo responded ${res.status}: ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send failed:', err);
    return false;
  }
}

export function resetEmail(name: string, link: string): { subject: string; html: string; text: string } {
  const who = name ? `Hi ${name},` : 'Hi,';
  const subject = 'Reset your GlassEstimate password';
  const text = `${who}\n\nWe received a request to reset your GlassEstimate password. Open the link below to choose a new one. It expires in 1 hour.\n\n${link}\n\nIf you didn't request this, you can ignore this email.`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a"><h2 style="margin:0 0 16px">Reset your password</h2><p style="margin:0 0 12px;color:#334155">${who}</p><p style="margin:0 0 20px;color:#334155">Click below to choose a new password. This link expires in <strong>1 hour</strong>.</p><p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">Choose a new password</a></p><p style="margin:0 0 8px;color:#64748b;font-size:13px">Or paste this link:</p><p style="margin:0 0 24px;color:#2563eb;font-size:13px;word-break:break-all">${link}</p><p style="margin:0;color:#94a3b8;font-size:12px">If you didn't request this, you can ignore this email.</p></div>`;
  return { subject, html, text };
}
