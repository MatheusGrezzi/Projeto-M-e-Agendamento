import type { AuditIssue, AuditStatus } from "@/lib/schemas/campaign-audit";
import { hasCriticalIssue } from "@/lib/schemas/campaign-audit";

export interface ApprovalGateInput {
  /** id of the campaign's current latest campaign_versions row. */
  latestVersionId: string;
  /** id of the version the human is trying to approve. */
  targetVersionId: string;
  /** id of the most recent audit for targetVersionId (null if never audited). */
  latestAuditIdForTargetVersion: string | null;
  /** id of the audit the human is approving against. */
  targetAuditId: string;
  auditStatus: AuditStatus;
  auditIssues: AuditIssue[];
}

export interface ApprovalGateResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Pure gating rule for human approval (briefing seção 18):
 * - only the campaign's current latest version can be approved
 * - the audit must be the latest one for that version (never an older/stale audit)
 * - no critical issue, and the audit itself isn't 'rejected'
 *
 * Kept side-effect-free and separate from services/campaign-audits-repository.ts
 * so the rule itself is unit-testable without a database.
 */
export function evaluateApprovalGate(input: ApprovalGateInput): ApprovalGateResult {
  if (input.targetVersionId !== input.latestVersionId) {
    return { allowed: false, reason: "Só é possível aprovar a versão mais recente da campanha — gere ou audite a versão atual primeiro." };
  }
  if (!input.latestAuditIdForTargetVersion || input.latestAuditIdForTargetVersion !== input.targetAuditId) {
    return { allowed: false, reason: "A auditoria informada não é a mais recente para esta versão." };
  }
  if (hasCriticalIssue(input.auditIssues) || input.auditStatus === "rejected") {
    return { allowed: false, reason: "Esta versão tem problemas críticos ou foi reprovada na auditoria — não pode ser aprovada." };
  }
  return { allowed: true, reason: null };
}
