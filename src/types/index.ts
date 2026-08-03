/** Shared types for the GlassEstimate application */

// ── User & Auth ───────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  firmName: string | null;
  createdAt: string;
}

// ── Subscriptions ─────────────────────────────────────

export type PlanTier = "starter" | "pro" | "business";

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  priceCents: number;
  documentsPerMonth: number;
  features: string[];
  stripePriceId: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planTier: PlanTier;
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
}

// ── Documents ─────────────────────────────────────────

export type DocumentStatus =
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export interface AnalyzedDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: DocumentStatus;
  originalText: string;
  analysis: DocumentAnalysis | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Analysis (from AI pipeline) ────────────────────────

export interface DocumentAnalysis {
  summary: string;
  keyClauses: KeyClause[];
  riskFlags: RiskFlag[];
  obligations: Obligation[];
  dates: DateItem[];
  recommendations: string;
}

export interface KeyClause {
  title: string;
  content: string;
  page?: number;
}

export interface RiskFlag {
  severity: "high" | "medium" | "low";
  clause: string;
  explanation: string;
  suggestion: string;
}

export interface Obligation {
  party: string;
  description: string;
  deadline?: string;
}

export interface DateItem {
  label: string;
  date: string;
  description: string;
}

// ── API Responses ─────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
