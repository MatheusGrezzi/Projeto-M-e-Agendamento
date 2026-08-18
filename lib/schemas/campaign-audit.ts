import { z } from "zod";

/**
 * AuditReportSchema — the official contract returned by the Agente Auditor
 * (deterministic pass + optional AI pass merged together). See
 * lib/agents/campaign-audit.ts for the orchestration and the
 * "any critical issue forces status=rejected" rule (never expressed here —
 * that's a business rule applied after parsing, not a schema constraint).
 */

export const AUDIT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export const AUDIT_STATUSES = ["approved", "warning", "rejected"] as const;
export const AUDIT_CATEGORIES = [
  "client_restrictions",
  "service_scope",
  "equipment_scope",
  "location_targeting",
  "keyword_intent",
  "keyword_match_type",
  "negative_keywords",
  "ad_relevance",
  "landing_page_relevance",
  "conversion_tracking",
  "budget",
  "bidding",
  "rsa_quality",
  "assets",
  "duplication",
  "policy_risk",
  "measurement",
  "other",
] as const;

export const auditIssueSchema = z.object({
  severity: z.enum(AUDIT_SEVERITIES),
  category: z.enum(AUDIT_CATEGORIES),
  title: z.string().trim().min(1),
  problem: z.string().trim().min(1),
  evidence: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
  requires_regeneration: z.boolean(),
});

export const auditReportSchema = z.object({
  score: z.number().int().min(0).max(100),
  status: z.enum(AUDIT_STATUSES),
  summary: z.string().trim().min(1),
  issues: z.array(auditIssueSchema),
  recommendations: z.array(z.string()),
  positives: z.array(z.string()),
});

export type AuditReport = z.infer<typeof auditReportSchema>;
export type AuditIssue = z.infer<typeof auditIssueSchema>;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/** Any critical issue forces rejection, no matter the numeric score — a mean can't hide a hard blocker. */
export function hasCriticalIssue(issues: AuditIssue[]): boolean {
  return issues.some((i) => i.severity === "critical");
}

/** Score → status thresholds, overridden by hasCriticalIssue() at the call site. */
export function statusFromScore(score: number): AuditStatus {
  if (score >= 90) return "approved";
  if (score >= 75) return "warning";
  return "rejected";
}
