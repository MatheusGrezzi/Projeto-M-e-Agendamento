import "server-only";

import type { CampaignContext } from "./campaign-context";

/**
 * AIProvider — the swap point for whatever actually generates a strategy.
 * Every implementation returns raw (unvalidated) JSON; the caller
 * (services/campaigns-repository.ts) is the one that runs it through
 * campaignStrategySchema.safeParse(). Never call provider.generateStrategy
 * from a Client Component or route handler exposed to the browser — API
 * keys for real providers only ever live in server env vars.
 */
export interface CampaignCorrection {
  /** The previous (invalid) attempt, so the provider can fix it instead of starting over. */
  previousOutput: unknown;
  /** zod issue messages describing what was wrong. */
  issues: string[];
}

export interface AIProvider {
  name: string;
  generateStrategy(context: CampaignContext, correction?: CampaignCorrection): Promise<unknown>;
}

/**
 * Picks the provider by env var — no DB-stored setting needed for V1.
 * Falls back to the deterministic engine whenever ANTHROPIC_API_KEY isn't
 * configured, so the app works out of the box with zero API cost; set the
 * key to upgrade to real AI-generated strategies without touching any code.
 */
export async function getConfiguredAIProvider(): Promise<AIProvider> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { anthropicProvider } = await import("./anthropic-provider");
    return anthropicProvider;
  }
  const { deterministicProvider } = await import("./deterministic-provider");
  return deterministicProvider;
}
