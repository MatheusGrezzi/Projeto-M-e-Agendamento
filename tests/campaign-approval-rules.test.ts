import { describe, expect, it } from "vitest";

import { evaluateApprovalGate, type ApprovalGateInput } from "@/lib/agents/campaign-approval-rules";
import type { AuditIssue } from "@/lib/schemas/campaign-audit";

function baseInput(overrides: Partial<ApprovalGateInput> = {}): ApprovalGateInput {
  return {
    latestVersionId: "version-2",
    targetVersionId: "version-2",
    latestAuditIdForTargetVersion: "audit-5",
    targetAuditId: "audit-5",
    auditStatus: "approved",
    auditIssues: [],
    ...overrides,
  };
}

function issue(severity: AuditIssue["severity"]): AuditIssue {
  return {
    severity,
    category: "other",
    title: "teste",
    problem: "teste",
    evidence: "teste",
    recommendation: "teste",
    requires_regeneration: false,
  };
}

describe("evaluateApprovalGate", () => {
  it("allows approval when the target is the latest version, audit is current, and there's no critical issue", () => {
    expect(evaluateApprovalGate(baseInput()).allowed).toBe(true);
  });

  it("allows approval when the audit status is 'warning' (not just 'approved')", () => {
    expect(evaluateApprovalGate(baseInput({ auditStatus: "warning" })).allowed).toBe(true);
  });

  it("blocks approval of anything other than the campaign's current latest version", () => {
    const result = evaluateApprovalGate(baseInput({ targetVersionId: "version-1", latestVersionId: "version-2" }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/versão mais recente/i);
  });

  it("blocks approval against a stale audit (a newer audit exists for the same version)", () => {
    const result = evaluateApprovalGate(baseInput({ targetAuditId: "audit-4", latestAuditIdForTargetVersion: "audit-5" }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/mais recente/i);
  });

  it("blocks approval when the version was never audited", () => {
    const result = evaluateApprovalGate(baseInput({ latestAuditIdForTargetVersion: null }));
    expect(result.allowed).toBe(false);
  });

  it("blocks approval when the audit status is 'rejected'", () => {
    const result = evaluateApprovalGate(baseInput({ auditStatus: "rejected" }));
    expect(result.allowed).toBe(false);
  });

  it("blocks approval when there is any critical issue, even if status says 'approved'", () => {
    const result = evaluateApprovalGate(baseInput({ auditStatus: "approved", auditIssues: [issue("critical")] }));
    expect(result.allowed).toBe(false);
  });

  it("does not block on high/medium/low issues alone", () => {
    const result = evaluateApprovalGate(baseInput({ auditIssues: [issue("high"), issue("medium"), issue("low")] }));
    expect(result.allowed).toBe(true);
  });
});
