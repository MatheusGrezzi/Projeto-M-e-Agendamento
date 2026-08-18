import "server-only";

import type { AIGenerationResult } from "./ai-provider";
import type { CampaignContext } from "./campaign-context";
import type { AuditIssue } from "@/lib/schemas/campaign-audit";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

/**
 * AuditorProvider — separate abstraction from AIProvider on purpose (see
 * briefing seção 8: "Não reutilizar o prompt do Estrategista"). Every
 * implementation returns raw (unvalidated) JSON plus generation metadata;
 * the caller (lib/agents/campaign-audit.ts) runs it through
 * auditReportSchema.safeParse() and merges it with the deterministic issues.
 */
export interface AuditorProvider {
  name: string;
  /**
   * `seedIssues` are the deterministic findings, given to the AI as context
   * it doesn't need to repeat — it should focus on qualitative judgment
   * (intent, coherence, waste, copy, structure, subtler conflicts).
   */
  auditStrategy(context: CampaignContext, strategy: CampaignStrategy, seedIssues: AuditIssue[]): Promise<AIGenerationResult>;
}

/**
 * Same AI_PROVIDER contract as getConfiguredAIProvider() — one env var
 * governs both agents. AI_PROVIDER=anthropic makes Claude mandatory for
 * auditing too; a missing key or a call failure is a controlled error, never
 * a silent fallback to deterministic-only auditing once Claude was
 * explicitly requested. When AI_PROVIDER is unset, auditing still always
 * happens (deterministic-only) — unlike the Estrategista, the Auditor's
 * deterministic pass is a first-class, always-run stage, not just a
 * zero-cost substitute.
 */
export async function getConfiguredAuditorProvider(): Promise<AuditorProvider | null> {
  const configured = process.env.AI_PROVIDER;

  if (configured === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("AI_PROVIDER=anthropic, mas ANTHROPIC_API_KEY não está configurada. Configure a chave ou remova AI_PROVIDER.");
    }
    const { anthropicAuditorProvider } = await import("./anthropic-auditor-provider");
    return anthropicAuditorProvider;
  }

  if (configured === "deterministic") return null;

  if (configured) {
    throw new Error(`AI_PROVIDER="${configured}" não é um valor válido (use "anthropic" ou "deterministic").`);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const { anthropicAuditorProvider } = await import("./anthropic-auditor-provider");
    return anthropicAuditorProvider;
  }
  return null;
}
