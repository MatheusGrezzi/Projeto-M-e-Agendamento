import "server-only";

import { runDeterministicAudit } from "./campaign-audit-deterministic";
import { getConfiguredAuditorProvider } from "./auditor-provider";
import type { CampaignContext } from "./campaign-context";
import { auditReportSchema, hasCriticalIssue, statusFromScore, type AuditIssue, type AuditReport } from "@/lib/schemas/campaign-audit";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

const SEVERITY_PENALTY: Record<AuditIssue["severity"], number> = { critical: 100, high: 15, medium: 7, low: 3 };

function heuristicScore(issues: AuditIssue[]): number {
  const penalty = issues.reduce((sum, i) => sum + SEVERITY_PENALTY[i.severity], 0);
  return Math.max(0, 100 - penalty);
}

export interface AuditGenerationResult {
  report: AuditReport;
  auditorProvider: "ai" | "deterministic";
  auditorModel: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
}

/**
 * DeterministicAudit → (Claude Auditor, if configured) → AuditSchema →
 * PostValidation (critical always forces rejected). The deterministic pass
 * always runs; the AI pass supplements it and is never a substitute for it.
 */
export async function runCampaignAudit(context: CampaignContext, strategy: CampaignStrategy): Promise<AuditGenerationResult> {
  const startedAt = Date.now();
  const deterministicIssues = runDeterministicAudit(context, strategy);

  const provider = await getConfiguredAuditorProvider();

  if (!provider) {
    const score = heuristicScore(deterministicIssues);
    const status = hasCriticalIssue(deterministicIssues) ? "rejected" : statusFromScore(score);
    const report: AuditReport = {
      score,
      status,
      summary:
        deterministicIssues.length === 0
          ? "Nenhum problema objetivo identificado pela verificação determinística. Configure ANTHROPIC_API_KEY para uma avaliação qualitativa mais profunda."
          : `${deterministicIssues.length} problema(s) identificado(s) pela verificação determinística (auditoria sem IA configurada).`,
      issues: deterministicIssues,
      recommendations: [],
      positives: [],
    };
    return {
      report,
      auditorProvider: "deterministic",
      auditorModel: "deterministic",
      promptVersion: "rule-based-v1",
      inputTokens: null,
      outputTokens: null,
      durationMs: Date.now() - startedAt,
    };
  }

  // AI_PROVIDER=anthropic (or an unset default that resolved to it) makes
  // Claude mandatory here too — a call failure propagates uncaught, exactly
  // like the Estrategista. No silent fallback to deterministic-only once
  // Claude was actually invoked.
  const generation = await provider.auditStrategy(context, strategy, deterministicIssues);
  const parsed = auditReportSchema.safeParse(generation.raw);
  if (!parsed.success) {
    throw new Error(
      `A resposta do Auditor (IA) não segue o AuditReportSchema: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
    );
  }

  // Merge: deterministic issues are authoritative and always included: the
  // AI is told about them but might still restate one — dedupe by
  // category+title so the same finding doesn't show twice.
  const seen = new Set(deterministicIssues.map((i) => `${i.category}:${i.title.toLowerCase()}`));
  const aiOnlyIssues = parsed.data.issues.filter((i) => !seen.has(`${i.category}:${i.title.toLowerCase()}`));
  const mergedIssues = [...deterministicIssues, ...aiOnlyIssues];

  const finalStatus = hasCriticalIssue(mergedIssues) ? "rejected" : parsed.data.status;
  const finalScore = hasCriticalIssue(mergedIssues) ? Math.min(parsed.data.score, 40) : parsed.data.score;

  const report: AuditReport = {
    ...parsed.data,
    issues: mergedIssues,
    status: finalStatus,
    score: finalScore,
  };

  return {
    report,
    auditorProvider: "ai",
    auditorModel: generation.model,
    promptVersion: generation.promptVersion,
    inputTokens: generation.inputTokens,
    outputTokens: generation.outputTokens,
    durationMs: generation.durationMs,
  };
}
