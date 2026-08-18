import { z } from "zod";

import { ASSET_LIMITS, RSA_LIMITS } from "@/lib/google-ads/limits";

/**
 * CampaignStrategySchema — the official contract between Reconnect OS, the
 * Estrategista, and (later) the Auditor/Executor/QA agents. Nothing gets
 * persisted as a valid `campaign_versions.strategy_json` unless it parses
 * against this schema — see services/campaigns-repository.ts.
 */

export const KEYWORD_MATCH_TYPES = ["exact", "phrase"] as const;
export const NEGATIVE_MATCH_TYPES = ["exact", "phrase", "broad"] as const;
export const NEGATIVE_CATEGORIES = [
  "parts",
  "diy",
  "employment",
  "training",
  "manuals",
  "irrelevant_equipment",
  "excluded_service",
  "excluded_location",
  "other",
] as const;
export const BIDDING_STRATEGIES = ["maximize_conversions", "maximize_conversion_value", "target_cpa", "manual_cpc"] as const;
export const CAMPAIGN_OBJECTIVES = ["leads", "whatsapp", "calls", "forms", "bookings"] as const;

export const keywordSchema = z.object({
  text: z.string().trim().min(1),
  match_type: z.enum(KEYWORD_MATCH_TYPES),
  intent: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

export const negativeKeywordSchema = z.object({
  text: z.string().trim().min(1),
  match_type: z.enum(NEGATIVE_MATCH_TYPES),
  category: z.enum(NEGATIVE_CATEGORIES),
  reason: z.string().trim().min(1),
});

export const rsaAdSchema = z.object({
  headlines: z
    .array(z.string().trim().min(1).max(RSA_LIMITS.HEADLINE_MAX_LENGTH))
    .min(RSA_LIMITS.HEADLINE_MIN_COUNT)
    .max(RSA_LIMITS.HEADLINE_MAX_COUNT),
  descriptions: z
    .array(z.string().trim().min(1).max(RSA_LIMITS.DESCRIPTION_MAX_LENGTH))
    .min(RSA_LIMITS.DESCRIPTION_MIN_COUNT)
    .max(RSA_LIMITS.DESCRIPTION_MAX_COUNT),
  path1: z.string().trim().max(RSA_LIMITS.PATH_MAX_LENGTH).optional(),
  path2: z.string().trim().max(RSA_LIMITS.PATH_MAX_LENGTH).optional(),
});

export const adGroupSchema = z.object({
  name: z.string().trim().min(1),
  theme: z.string().trim().min(1),
  equipment: z.string().trim().min(1),
  service: z.string().trim().min(1),
  landing_page: z.string().trim().url().nullable(),
  keywords: z.array(keywordSchema).min(1),
  ads: z.array(rsaAdSchema).min(1),
});

export const campaignStrategySchema = z.object({
  meta: z.object({
    schema_version: z.literal("1.0"),
    campaign_type: z.literal("search"),
    generated_at: z.string(),
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
  }),
  campaign: z.object({
    name: z.string().trim().min(1),
    objective: z.enum(CAMPAIGN_OBJECTIVES),
    daily_budget: z.number().positive(),
    language: z.string().trim().min(1).default("pt-BR"),
  }),
  bidding: z.object({
    strategy: z.enum(BIDDING_STRATEGIES),
    reason: z.string().trim().min(1),
  }),
  locations: z.object({
    included: z.array(z.string().trim().min(1)),
    excluded: z.array(z.string().trim().min(1)),
  }),
  conversions: z.array(z.string().trim().min(1)),
  ad_groups: z.array(adGroupSchema).min(1),
  campaign_negatives: z.array(negativeKeywordSchema),
  assets: z.object({
    sitelinks: z.array(z.string().trim().max(ASSET_LIMITS.SITELINK_MAX_LENGTH)),
    callouts: z.array(z.string().trim().max(ASSET_LIMITS.CALLOUT_MAX_LENGTH)),
    structured_snippets: z.array(z.string().trim().max(ASSET_LIMITS.STRUCTURED_SNIPPET_MAX_LENGTH)),
  }),
  warnings: z.array(z.string()),
  assumptions: z.array(z.string()),
  strategy_summary: z.string().trim().min(1),
});

export type CampaignStrategy = z.infer<typeof campaignStrategySchema>;
export type StrategyAdGroup = z.infer<typeof adGroupSchema>;
export type StrategyKeyword = z.infer<typeof keywordSchema>;
export type StrategyNegative = z.infer<typeof negativeKeywordSchema>;
export type StrategyRsaAd = z.infer<typeof rsaAdSchema>;
