import "server-only";

import type { CampaignContext } from "./campaign-context";

/**
 * AIProvider — the swap point for whatever actually generates a strategy.
 * Every implementation returns raw (unvalidated) JSON plus generation
 * metadata for the audit trail; the caller (services/campaigns-repository.ts)
 * is the one that runs the raw output through campaignStrategySchema.safeParse().
 * Never call provider.generateStrategy from a Client Component or route
 * handler exposed to the browser — API keys for real providers only ever
 * live in server env vars.
 */
export interface CampaignCorrection {
  /** The previous (invalid) attempt, so the provider can fix it instead of starting over. */
  previousOutput: unknown;
  /** zod issue messages (or business-rule violations) describing what was wrong. */
  issues: string[];
}

export interface AIGenerationResult {
  raw: unknown;
  /** 'anthropic' | 'deterministic' — matches campaign_versions.generator_type. */
  providerType: "ai" | "deterministic";
  /** Model identifier, or 'deterministic' for the rule-based engine. */
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
}

export interface AIProvider {
  name: string;
  generateStrategy(context: CampaignContext, correction?: CampaignCorrection): Promise<AIGenerationResult>;
}

/**
 * Picks the provider strictly by env var — no DB-stored setting needed for V1.
 *
 * - AI_PROVIDER=anthropic → Claude is mandatory. Missing ANTHROPIC_API_KEY (or
 *   any later call failure) is a controlled, surfaced error — this function
 *   and the repository layer NEVER silently swap in the deterministic engine
 *   once Claude was explicitly requested.
 * - AI_PROVIDER=deterministic → forces the rule-based engine even if a key
 *   is present (useful for tests / zero-cost runs).
 * - AI_PROVIDER unset → inferred from ANTHROPIC_API_KEY presence, so the app
 *   works out of the box with zero configuration.
 */
export async function getConfiguredAIProvider(): Promise<AIProvider> {
  const configured = process.env.AI_PROVIDER;

  if (configured === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("AI_PROVIDER=anthropic, mas ANTHROPIC_API_KEY não está configurada. Configure a chave ou remova AI_PROVIDER.");
    }
    const { anthropicProvider } = await import("./anthropic-provider");
    return anthropicProvider;
  }

  if (configured === "deterministic") {
    const { deterministicProvider } = await import("./deterministic-provider");
    return deterministicProvider;
  }

  if (configured) {
    throw new Error(`AI_PROVIDER="${configured}" não é um valor válido (use "anthropic" ou "deterministic").`);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const { anthropicProvider } = await import("./anthropic-provider");
    return anthropicProvider;
  }
  const { deterministicProvider } = await import("./deterministic-provider");
  return deterministicProvider;
}
