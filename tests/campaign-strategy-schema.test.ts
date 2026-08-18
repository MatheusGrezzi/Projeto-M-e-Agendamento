import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { campaignStrategySchema } from "@/lib/schemas/campaign-strategy";
import { RSA_LIMITS } from "@/lib/google-ads/limits";

function validStrategy(): z.input<typeof campaignStrategySchema> {
  return {
    meta: { schema_version: "1.0", campaign_type: "search", generated_at: "2026-08-18T00:00:00Z", client_id: "11111111-1111-4111-8111-111111111111", campaign_id: "22222222-2222-4222-8222-222222222222" },
    campaign: { name: "Campanha Frio Fácil", objective: "whatsapp", daily_budget: 100, language: "pt-BR" },
    bidding: { strategy: "maximize_conversions", reason: "Sem histórico de CPA ainda." },
    locations: { included: ["Betim"], excluded: [] },
    conversions: ["Clique no WhatsApp"],
    ad_groups: [
      {
        name: "Conserto — Geladeira",
        theme: "Conserto",
        equipment: "Geladeira",
        service: "Conserto",
        landing_page: "https://friofacil.com/conserto-geladeira-betim",
        keywords: [{ text: "conserto de geladeira", match_type: "phrase", intent: "contratar_assistencia", reason: "Alta intenção comercial." }],
        ads: [
          {
            headlines: ["Geladeira com problema?", "Conserto rápido", "Frio Fácil", "Atendimento hoje"],
            descriptions: ["Especialistas em conserto.", "Peça um orçamento agora."],
            path1: "conserto",
          },
        ],
      },
    ],
    campaign_negatives: [{ text: "curso", match_type: "broad", category: "training", reason: "Baixa intenção comercial." }],
    assets: { sitelinks: ["Orçamento grátis"], callouts: ["Atendimento rápido"], structured_snippets: [] },
    warnings: [],
    assumptions: [],
    strategy_summary: "Resumo.",
  };
}

describe("campaignStrategySchema", () => {
  it("accepts a well-formed strategy", () => {
    const result = campaignStrategySchema.safeParse(validStrategy());
    expect(result.success).toBe(true);
  });

  it("rejects a positive keyword with match_type 'broad' (not allowed per briefing)", () => {
    const strategy = validStrategy();
    (strategy.ad_groups[0].keywords[0] as { match_type: string }).match_type = "broad";
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it("rejects a headline longer than the Google Ads limit", () => {
    const strategy = validStrategy();
    strategy.ad_groups[0].ads[0].headlines[0] = "x".repeat(RSA_LIMITS.HEADLINE_MAX_LENGTH + 1);
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it("rejects an ad with fewer headlines than the minimum", () => {
    const strategy = validStrategy();
    strategy.ad_groups[0].ads[0].headlines = ["Only one"];
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it("rejects a negative keyword with an invalid category", () => {
    const strategy = validStrategy() as Record<string, unknown>;
    (strategy.campaign_negatives as { category: string }[])[0].category = "not_a_real_category";
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it("accepts a negative keyword with match_type 'broad' (negatives allow broad, unlike positives)", () => {
    const strategy = validStrategy();
    strategy.campaign_negatives[0].match_type = "broad";
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(true);
  });

  it("rejects an ad_group list with zero groups", () => {
    const strategy = validStrategy();
    strategy.ad_groups = [];
    const result = campaignStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it("allows landing_page to be null but not an invalid URL", () => {
    const strategy = validStrategy();
    strategy.ad_groups[0].landing_page = null;
    expect(campaignStrategySchema.safeParse(strategy).success).toBe(true);

    strategy.ad_groups[0].landing_page = "not-a-url";
    expect(campaignStrategySchema.safeParse(strategy).success).toBe(false);
  });
});
