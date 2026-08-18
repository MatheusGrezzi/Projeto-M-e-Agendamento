import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

export function fixtureStrategy(overrides: Partial<CampaignStrategy> = {}): CampaignStrategy {
  return {
    meta: {
      schema_version: "1.0",
      campaign_type: "search",
      generated_at: "2026-08-18T00:00:00Z",
      client_id: "11111111-1111-4111-8111-111111111111",
      campaign_id: "22222222-2222-4222-8222-222222222222",
    },
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
        keywords: [
          { text: "conserto de geladeira", match_type: "phrase", intent: "contratar_assistencia", reason: "Alta intenção comercial." },
          { text: "assistência técnica geladeira", match_type: "phrase", intent: "contratar_assistencia", reason: "Busca direta." },
        ],
        ads: [
          {
            headlines: ["Geladeira com problema?", "Conserto rápido", "Frio Fácil", "Atendimento hoje", "Orçamento grátis"],
            descriptions: ["Especialistas em conserto de geladeira. Atendimento rápido.", "Solicite um orçamento agora pelo WhatsApp."],
          },
        ],
      },
    ],
    campaign_negatives: [{ text: "curso de conserto", match_type: "broad", category: "training", reason: "Baixa intenção comercial." }],
    assets: { sitelinks: ["Orçamento grátis"], callouts: ["Atendimento rápido"], structured_snippets: ["Betim"] },
    warnings: [],
    assumptions: [],
    strategy_summary: "Resumo de teste.",
    ...overrides,
  };
}
