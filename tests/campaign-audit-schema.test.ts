import { describe, expect, it } from "vitest";

import { auditReportSchema, hasCriticalIssue, statusFromScore } from "@/lib/schemas/campaign-audit";
import type { AuditIssue } from "@/lib/schemas/campaign-audit";

function validReport() {
  return {
    score: 92,
    status: "approved",
    summary: "Estratégia sólida, sem problemas graves.",
    issues: [
      {
        severity: "low",
        category: "rsa_quality",
        title: "Poucos títulos",
        problem: "Apenas 5 títulos no anúncio.",
        evidence: "headlines.length = 5",
        recommendation: "Adicionar mais títulos.",
        requires_regeneration: false,
      },
    ],
    recommendations: ["Adicionar mais callouts."],
    positives: ["Boa cobertura de palavras-chave de alta intenção."],
  };
}

describe("auditReportSchema", () => {
  it("accepts a well-formed audit report", () => {
    expect(auditReportSchema.safeParse(validReport()).success).toBe(true);
  });

  it("rejects a score outside 0-100", () => {
    expect(auditReportSchema.safeParse({ ...validReport(), score: 150 }).success).toBe(false);
    expect(auditReportSchema.safeParse({ ...validReport(), score: -1 }).success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const report = validReport() as Record<string, unknown>;
    report.status = "maybe";
    expect(auditReportSchema.safeParse(report).success).toBe(false);
  });

  it("rejects an issue with an invalid severity", () => {
    const report = validReport();
    (report.issues[0] as unknown as { severity: string }).severity = "extreme";
    expect(auditReportSchema.safeParse(report).success).toBe(false);
  });

  it("rejects an issue missing evidence", () => {
    const report = validReport();
    // @ts-expect-error intentionally omitting a required field for the test
    delete report.issues[0].evidence;
    expect(auditReportSchema.safeParse(report).success).toBe(false);
  });
});

function issue(severity: AuditIssue["severity"]): AuditIssue {
  return { severity, category: "other", title: "t", problem: "p", evidence: "e", recommendation: "r", requires_regeneration: false };
}

describe("hasCriticalIssue", () => {
  it("is true when any issue is critical", () => {
    expect(hasCriticalIssue([issue("high"), issue("critical")])).toBe(true);
  });
  it("is false when no issue is critical", () => {
    expect(hasCriticalIssue([issue("high"), issue("medium"), issue("low")])).toBe(false);
  });
  it("is false for an empty issue list", () => {
    expect(hasCriticalIssue([])).toBe(false);
  });
});

describe("statusFromScore", () => {
  it("approves at 90 and above", () => {
    expect(statusFromScore(90)).toBe("approved");
    expect(statusFromScore(100)).toBe("approved");
  });
  it("warns between 75 and 89", () => {
    expect(statusFromScore(75)).toBe("warning");
    expect(statusFromScore(89)).toBe("warning");
  });
  it("rejects below 75", () => {
    expect(statusFromScore(74)).toBe("rejected");
    expect(statusFromScore(0)).toBe("rejected");
  });
});
