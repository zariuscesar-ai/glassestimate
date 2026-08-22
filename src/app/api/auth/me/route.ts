import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Returns the signed-in user + their company, or 401 if not authenticated.
// The sidebar uses this to show who's logged in and which shop is active.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await db.users.getById(session.uid);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const company = await db.companies.getById(user.company_id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    company: company
      ? {
          id: company.id,
          name: company.name,
          plan: company.plan || 'both',
          subscription_status: company.subscription_status || 'none',
          current_period_end: company.current_period_end || null,
        }
      : null,
  });
}
