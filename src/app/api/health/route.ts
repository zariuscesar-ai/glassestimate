import { NextResponse } from 'next/server';
import { db, persistenceBackend } from '@/lib/db';

// Always run per-request against the live datastore (never statically prerender).
export const dynamic = 'force-dynamic';

// Lightweight health/diagnostics endpoint.
// GET /api/health -> confirms which persistence backend is live and that a
// round-trip to it succeeds. Use this after deploying to verify production is
// actually talking to the KV store ("backend":"kv") rather than the ephemeral
// file fallback ("backend":"file").
export async function GET() {
  try {
    const companies = await db.companies.all();
    return NextResponse.json({
      ok: true,
      backend: persistenceBackend,
      seeded: companies.length > 0,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, backend: persistenceBackend, error: (err as Error).message },
      { status: 500 },
    );
  }
}
