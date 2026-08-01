# Authentication + Multi-Tenant — Setup & Handoff

This branch (`feat/auth-multitenant`) adds real login and per-shop data isolation
to GlassEstimate. Before this, the whole app was publicly reachable and every
record was hardcoded to `company_id = 1`. Now every request is tied to a
signed-in user and scoped to their company.

**It is intentionally NOT merged to production yet** — an auth change should be
reviewed and have its one required env var set before it goes live, so it can't
lock you out of your own app.

## What changed

- **Self-contained auth** (no external service to provision): email + password,
  passwords hashed with scrypt (`node:crypto`), sessions are HMAC-signed cookies.
  Chosen over Clerk/Auth0 so nothing needs a third-party account or keys, and it
  works directly with the Upstash KV datastore already in place.
- **New:** `/login` and `/signup` pages; `/api/auth/{login,signup,logout,me}`.
- **Middleware** (`src/middleware.ts`) gates every app page and data API. Public:
  `/login`, `/signup`, `/api/auth/*`, `/api/health`, `/landing.html`, static
  assets, and `glassestimate.app/` (the marketing homepage). Unauthenticated
  page requests redirect to `/login`; API requests get 401.
- **Multi-tenant:** every data route (`clients`, `products`, `invoices`,
  `estimates`, `jobs`, `payments`, `stats`, `companies`, `settings`) is scoped to
  the session's company, with per-record ownership checks on `/[id]` routes
  (fetching another company's record by URL returns 404).
- **New tenants** created via `/signup` get their own company **preloaded with
  the full 35-item glass catalog + 8 wall-system bundles**, so a new shop is
  usable immediately.
- Sidebar now shows the signed-in user + company and a **Log out** button.

## REQUIRED before deploy: env vars

The repo is **public**, so no password is hardcoded. Both of these are set as
Vercel environment variables (Production + Preview), never in code.

### 1. `SEED_OWNER_PASSWORD` — your Eagles Glass login password
The existing Eagles Glass data (company 1) gets an owner login the first time
someone logs in after this deploys. The email defaults to `zariuscesar@yahoo.com`
(override with `SEED_OWNER_EMAIL`); the password comes from `SEED_OWNER_PASSWORD`.

- Vercel → **glassestimate** → **Settings → Environment Variables** → add
  `SEED_OWNER_PASSWORD` = (your chosen password), scope **Production + Preview**,
  mark Sensitive.
- If `SEED_OWNER_PASSWORD` is unset, no seed login is created and you can't log
  in to the existing data — so set it before/at deploy.
- Note: the owner account is created once, on first login. Changing this env var
  later does NOT change an already-created account's password (needs the
  change-password screen — see TODO). So pick the password you want now.

### 2. Set the `AUTH_SECRET` environment variable in Vercel
Sessions are signed with `AUTH_SECRET`. If it's unset, the app still runs but
falls back to a well-known key = **insecure** (it logs a warning). Set a strong
random value:

- Generate one, e.g. in a terminal: `openssl rand -base64 48`
- Vercel → **glassestimate** project → **Settings → Environment Variables** →
  add `AUTH_SECRET` = (the value), scope **Production + Preview** → Save.
- Redeploy so it takes effect.

## Ship it (tomorrow)

The change is delivered as a git patch (`glassestimate-auth.patch`, placed in
your Downloads). Same flow as the persistence PR:

```bash
cd ~/glassestimate-fix            # the fresh clone from last session
git checkout main && git pull
git checkout -b feat/auth-multitenant
git am ~/Downloads/glassestimate-auth.patch
# (edit src/lib/auth.ts SEED_OWNER.password first if you want a private password)
git push -u origin feat/auth-multitenant
```

Then open the PR on GitHub, review, set `AUTH_SECRET` in Vercel (step 2 above),
and merge. After deploy, go to `glassestimate.app/login` — you should be
redirected there for any app page, and your login lands you in your data.

## Verified locally (this session)

Ran against a dev server with a test `AUTH_SECRET`:
- Unauthenticated `/clients` → 307 redirect to `/login?next=/clients`; `/api/clients` → 401; `/api/health` → 200.
- Eagles Glass owner login → sees its 35 products + only its own clients.
- New signup (Bravo Glass) → isolated tenant, its own 35-item seeded catalog.
- Isolation: company A sees only A's data, B only B's; B fetching A's record by URL → 404; per-company stats correct.
- Logout → subsequent API calls 401; wrong password → 401.
- `npm run build` = EXIT 0 (middleware compiles clean).

## TODO for future sessions (not in this branch)

- **Change-password + profile screen** (top priority so the seed password can be rotated in-app).
- Password reset (email link) — needs an email sender.
- **Invite teammates** to a company (multi-user per shop; `role` field already exists: owner/member).
- **Wire Stripe to access**: right now anyone can `/signup` for free. Gate signup/access behind the $39/mo subscription (the Stripe Payment Links already exist) — e.g. mark a company `active` only after checkout, check it in middleware.
- Login rate-limiting / lockout, and email verification.
- Consider moving from the single JSON blob to per-company relational tables (Neon/Supabase already in the Vercel team) as tenant count grows.
