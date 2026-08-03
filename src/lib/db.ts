import { sql } from "@vercel/postgres";

/**
 * Database helpers for GlassEstimate.
 * Uses Vercel Postgres (Neon) — free tier, no Supabase needed.
 *
 * Tables are auto-created on first query via the schema below.
 * Or run CREATE_TABLES manually.
 */

// ── Table Creation ───────────────────────────────────

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    firm_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    status TEXT DEFAULT 'uploading',
    original_text TEXT,
    analysis_json JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    plan_tier TEXT DEFAULT 'starter',
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS shower_estimates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT,
    style_id TEXT NOT NULL,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    glass_thickness TEXT NOT NULL,
    glass_type TEXT NOT NULL,
    hardware_finish TEXT NOT NULL,
    door_config_json JSONB,
    hardware_ids_json JSONB,
    extra_cutouts_json JSONB,
    estimate_json JSONB,
    total_cents INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
`;

// ── User Operations ──────────────────────────────────

export async function createUser(
  email: string,
  passwordHash: string,
  fullName?: string
) {
  const { rows } = await sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName || null})
    RETURNING id, email, full_name, created_at
  `;
  return rows[0];
}

export async function getUserByEmail(email: string) {
  const { rows } = await sql`
    SELECT id, email, password_hash, full_name, firm_name, created_at
    FROM users WHERE email = ${email}
  `;
  return rows[0] || null;
}

export async function getUserById(id: string) {
  const { rows } = await sql`
    SELECT id, email, full_name, firm_name, created_at
    FROM users WHERE id = ${id}
  `;
  return rows[0] || null;
}

// ── Document Operations ──────────────────────────────

export async function saveDocument(params: {
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  originalText: string;
  analysisJson?: Record<string, unknown>;
}) {
  const { rows } = await sql`
    INSERT INTO documents (user_id, file_name, file_size, file_type, original_text, analysis_json, status)
    VALUES (${params.userId}, ${params.fileName}, ${params.fileSize}, ${params.fileType},
            ${params.originalText}, ${params.analysisJson ? JSON.stringify(params.analysisJson) : null}, 'completed')
    RETURNING *
  `;
  return rows[0];
}

export async function getUserDocuments(userId: string) {
  const { rows } = await sql`
    SELECT id, file_name, file_size, file_type, status, created_at
    FROM documents WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 50
  `;
  return rows;
}

export async function getDocumentById(id: string, userId: string) {
  const { rows } = await sql`
    SELECT * FROM documents WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

// ── Subscription Operations ──────────────────────────

export async function getSubscription(userId: string) {
  const { rows } = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${userId}
  `;
  return rows[0] || null;
}

export async function upsertSubscription(params: {
  userId: string;
  planTier: string;
  status: string;
  stripeSubscriptionId?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  const { rows } = await sql`
    INSERT INTO subscriptions (user_id, plan_tier, status, stripe_subscription_id, current_period_start, current_period_end)
    VALUES (${params.userId}, ${params.planTier}, ${params.status},
            ${params.stripeSubscriptionId || null},
            ${params.periodStart ? new Date(params.periodStart).toISOString() : null},
            ${params.periodEnd ? new Date(params.periodEnd).toISOString() : null})
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_tier = EXCLUDED.plan_tier,
      status = EXCLUDED.status,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end
    RETURNING *
  `;
  return rows[0];
}

// ── Init ─────────────────────────────────────────────

export async function initDatabase() {
  await sql.query(CREATE_TABLES);
  console.log("Database tables verified.");
}

// ── Shower Estimate Operations ───────────────────────

export async function saveShowerEstimate(params: {
  userId: string;
  projectName?: string;
  styleId: string;
  width: number;
  height: number;
  glassThickness: string;
  glassType: string;
  hardwareFinish: string;
  doorConfig?: Record<string, unknown>;
  hardwareIds?: string[];
  extraCutouts?: Record<string, unknown>[];
  estimateJson?: Record<string, unknown>;
  totalCents?: number;
}) {
  const { rows } = await sql`
    INSERT INTO shower_estimates (
      user_id, project_name, style_id, width, height,
      glass_thickness, glass_type, hardware_finish,
      door_config_json, hardware_ids_json, extra_cutouts_json,
      estimate_json, total_cents
    )
    VALUES (
      ${params.userId}, ${params.projectName || null}, ${params.styleId},
      ${params.width}, ${params.height},
      ${params.glassThickness}, ${params.glassType}, ${params.hardwareFinish},
      ${params.doorConfig ? JSON.stringify(params.doorConfig) : null},
      ${params.hardwareIds ? JSON.stringify(params.hardwareIds) : null},
      ${params.extraCutouts ? JSON.stringify(params.extraCutouts) : null},
      ${params.estimateJson ? JSON.stringify(params.estimateJson) : null},
      ${params.totalCents || null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getUserShowerEstimates(userId: string) {
  const { rows } = await sql`
    SELECT id, project_name, style_id, width, height,
           glass_thickness, glass_type, hardware_finish,
           total_cents, created_at
    FROM shower_estimates
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows;
}

export async function getShowerEstimateById(id: string, userId: string) {
  const { rows } = await sql`
    SELECT * FROM shower_estimates
    WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows[0] || null;
}
