# Production Data Persistence — Setup

**Why this exists:** The app stores all data (clients, estimates, invoices,
payments, jobs, visual projects) as a single JSON document. Previously that
document was a `data.json` file on disk. On Vercel's serverless runtime the
filesystem is read-only and ephemeral, so every write was silently lost and the
app reset to seed data on each request. The data layer (`src/lib/db.ts`) now
persists that document to a durable **Upstash Redis** store in production, and
falls back to the local `data.json` file only when no KV environment variables
are present (so `npm run dev` still works with zero setup).

## One-time provisioning (Vercel dashboard)

1. Open your project on **vercel.com → Storage**.
2. Click **Create Database → Upstash (Redis)** (Vercel Marketplace). Pick the
   free tier and a region close to your app's region.
3. When prompted, **connect it to the `glassestimate` project** for the
   Production (and Preview) environments. Vercel injects the credentials as
   environment variables automatically — you do **not** need to copy anything by
   hand.

The code accepts either naming convention, so it works no matter which the
integration uses:

- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV style), **or**
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (raw Upstash style)

4. **Redeploy** (push any commit, or hit *Redeploy* in Vercel) so the new env
   vars are picked up.

## Verify it worked

After deploying, open:

```
https://glassestimate.app/api/health
```

You want to see:

```json
{ "ok": true, "backend": "kv", "seeded": true, ... }
```

- `"backend": "kv"` → production is talking to Upstash. ✅ Data now persists.
- `"backend": "file"` → env vars are missing; it's still using the ephemeral
  file fallback. Re-check steps 1–4.

Then create a client in the live app, redeploy (forces a cold start), and
confirm the client is still there. It will be.

## Local development

Nothing to configure. With no KV env vars set, `npm run dev` uses a local
`data.json` (git-ignored). To test the KV path locally, create a
`.env.local` with the four variables above and restart the dev server.

## Notes / future

- The store is a single JSON blob read-modify-written on each change. This is
  intentionally simple and correct for the current single-shop scale.
- When multi-tenant auth (finding #2) lands, this is the natural point to move
  from one JSON blob to proper per-company relational tables. The async data-
  layer API (`await db.*`) already in place will not need to change for the
  route/UI code — only `db.ts`'s internals.
