import type { CampaignContext } from "./campaign-context";
import type { AIGenerationResult, AIProvider } from "./ai-provider";
import type { CampaignStrategy, StrategyKeyword, StrategyNegative } from "@/lib/schemas/campaign-strategy";
import { RSA_LIMITS } from "@/lib/google-ads/limits";
import type { ClientLandingPage } from "@/types";

export const DETERMINISTIC_PROMPT_VERSION = "rule-based-v1";

const BASELINE_NEGATIVES: { text: string; category: StrategyNegative["category"]; reason: string }[] = [
  { text: "curso", category: "training", reason: "Baixa intenção comercial — busca por capacitação, não por contratação de serviço." },
  { text: "apostila", category: "manuals", reason: "Baixa intenção comercial — busca por material de estudo." },
  { text: "manual pdf", category: "manuals", reason: "Busca por manual técnico, não por contratação de assistência." },
  { text: "como consertar sozinho", category: "diy", reason: "Intenção de fazer o reparo por conta própria (DIY), não de contratar." },
  { text: "passo a passo", category: "diy", reason: "Intenção de fazer o reparo por conta própria (DIY), não de contratar." },
  { text: "emprego", category: "employment", reason: "Busca por vaga de trabalho, não por contratação de serviço." },
  { text: "vaga", category: "employment", reason: "Busca por vaga de trabalho, não por contratação de serviço." },
  { text: "currículo", category: "employment", reason: "Busca por vaga de trabalho, não por contratação de serviço." },
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function findLandingPage(pages: ClientLandingPage[], equipmentId: string, serviceId: string, cities: string[]): ClientLandingPage | null {
  const exact = pages.find((lp) => lp.equipmentId === equipmentId && lp.serviceId === serviceId && (lp.city ? cities.includes(lp.city) : true));
  if (exact) return exact;
  return pages.find((lp) => lp.equipmentId === equipmentId && lp.serviceId === serviceId) ?? null;
}

function buildKeywords(serviceName: string, equipmentName: string, cities: string[]): StrategyKeyword[] {
  const service = normalize(serviceName);
  const equipment = normalize(equipmentName);
  const keywords: StrategyKeyword[] = [
    { text: `${service} de ${equipment}`, match_type: "phrase", intent: "contratar_assistencia", reason: "Termo genérico de alta intenção comercial para este serviço." },
    { text: `assistência técnica ${equipment}`, match_type: "phrase", intent: "contratar_assistencia", reason: "Busca direta por assistência técnica especializada." },
    { text: `${service} ${equipment}`, match_type: "exact", intent: "contratar_assistencia", reason: "Correspondência exata de alta relevância com o grupo de anúncios." },
  ];
  for (const city of cities.slice(0, 2)) {
    keywords.push({
      text: `${service} de ${equipment} em ${normalize(city)}`,
      match_type: "phrase",
      intent: "contratar_assistencia_local",
      reason: `Intenção comercial com localização explícita (${city}), maior probabilidade de conversão.`,
    });
  }
  return keywords;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

function buildAd(clientDisplayName: string, serviceName: string, equipmentName: string, cities: string[]) {
  const cityPart = cities.length > 0 ? `Atendemos ${cities.slice(0, 2).join(" e ")}` : "Atendimento na sua região";
  const headlines = [
    `${equipmentName} com problema?`,
    `${serviceName} de ${equipmentName}`,
    `${clientDisplayName}`,
    `Atendimento rápido`,
    `Orçamento sem compromisso`,
    `Agende seu ${normalize(serviceName)}`,
  ].map((h) => truncate(h, RSA_LIMITS.HEADLINE_MAX_LENGTH));

  const descriptions = [
    truncate(`Especialistas em ${normalize(serviceName)} de ${normalize(equipmentName)}. Atendimento rápido.`, RSA_LIMITS.DESCRIPTION_MAX_LENGTH),
    truncate(`Solicite um orçamento agora. ${cityPart}.`, RSA_LIMITS.DESCRIPTION_MAX_LENGTH),
  ];

  return { headlines, descriptions, path1: truncate(normalize(serviceName).replace(/\s+/g, "-"), RSA_LIMITS.PATH_MAX_LENGTH) };
}

export const deterministicProvider: AIProvider = {
  name: "deterministic",

  async generateStrategy(context: CampaignContext): Promise<AIGenerationResult> {
    const startedAt = Date.now();
    const clientDisplayName = context.client.tradeName || context.client.name;
    const cities = context.locations.map((l) => l.city);
    const warnings: string[] = [];
    const assumptions: string[] = [
      "Estratégia gerada pelo motor determinístico (sem IA) — combinações de palavras-chave seguem templates fixos, não análise de mercado real.",
    ];

    const adGroups = context.selectedServices.map((offering) => {
      const landingPage = findLandingPage(context.selectedLandingPages, offering.equipmentId, offering.serviceId, cities);
      if (!landingPage) {
        warnings.push(`Sem landing page selecionada para "${offering.serviceName} de ${offering.equipmentName}".`);
      }

      return {
        name: `${offering.serviceName} — ${offering.equipmentName}`,
        theme: offering.serviceName,
        equipment: offering.equipmentName,
        service: offering.serviceName,
        landing_page: landingPage?.url ?? null,
        keywords: buildKeywords(offering.serviceName, offering.equipmentName, cities),
        ads: [buildAd(clientDisplayName, offering.serviceName, offering.equipmentName, cities)],
      };
    });

    const contextualNegatives: StrategyNegative[] = [];
    for (const excluded of context.excludedServices) {
      const label = excluded.label ?? [excluded.equipmentName, excluded.serviceName].filter(Boolean).join(" / ");
      if (label) {
        contextualNegatives.push({
          text: normalize(label),
          match_type: "phrase",
          category: "excluded_service",
          reason: `Este cliente marcou "${label}" como serviço não realizado.`,
        });
      }
    }
    for (const excluded of context.excludedEquipment) {
      const label = excluded.equipmentName ?? excluded.label;
      if (label) {
        contextualNegatives.push({
          text: normalize(label),
          match_type: "phrase",
          category: "irrelevant_equipment",
          reason: `Este cliente marcou "${label}" como equipamento não atendido.`,
        });
      }
    }
    const negatives: StrategyNegative[] = [
      ...contextualNegatives,
      ...BASELINE_NEGATIVES.map((n) => ({ text: n.text, match_type: "broad" as const, category: n.category, reason: n.reason })),
      { text: "comprar peça", match_type: "broad", category: "parts", reason: "Termo genérico de baixa intenção comercial de contratação." },
      { text: "peça avulsa", match_type: "broad", category: "parts", reason: "Termo genérico de baixa intenção comercial de contratação." },
    ];

    if (context.excludedLocations.length > 0) {
      assumptions.push(
        `As regiões ${context.excludedLocations.map((l) => `${l.city}/${l.state}`).join(", ")} foram excluídas por serem restrições cadastradas deste cliente.`
      );
    }

    const strategy: CampaignStrategy = {
      meta: {
        schema_version: "1.0",
        campaign_type: "search",
        generated_at: new Date().toISOString(),
        client_id: context.client.id,
        campaign_id: context.campaignId,
      },
      campaign: {
        name: `Campanha ${clientDisplayName}`,
        objective: context.objective,
        daily_budget: context.budget.daily,
        language: "pt-BR",
      },
      bidding: {
        strategy: "maximize_conversions",
        reason:
          context.selectedConversions.length > 0
            ? "Conversões cadastradas — maximizar conversões aproveita o sinal existente sem exigir histórico de CPA."
            : "Sem conversões cadastradas ainda; maximizar conversões é o ponto de partida mais seguro até haver dados de custo por resultado.",
      },
      locations: {
        included: cities,
        excluded: context.excludedLocations.map((l) => `${l.city}`),
      },
      conversions: context.selectedConversions.map((c) => c.name),
      ad_groups: adGroups,
      campaign_negatives: negatives,
      assets: {
        sitelinks: [truncate("Orçamento grátis", 25), context.client.primaryCity ? truncate(`Atende ${context.client.primaryCity}`, 25) : null].filter(
          (s): s is string => Boolean(s)
        ),
        callouts: [truncate("Atendimento rápido", 25), truncate("Sem compromisso", 25)],
        structured_snippets: cities.length > 0 ? [truncate(cities.slice(0, 3).join(", "), 25)] : [],
      },
      warnings,
      assumptions,
      strategy_summary:
        `${adGroups.length} grupo(s) de anúncio para "${context.selectedSegment.label}", ` +
        `cobrindo ${cities.length} região(ões), orçamento diário R$ ${context.budget.daily.toFixed(2)} (≈ R$ ${context.budget.monthlyEstimate.toFixed(2)}/mês), ` +
        `objetivo: ${context.objective}.`,
    };

    return {
      raw: strategy,
      providerType: "deterministic",
      model: "deterministic",
      promptVersion: DETERMINISTIC_PROMPT_VERSION,
      inputTokens: null,
      outputTokens: null,
      durationMs: Date.now() - startedAt,
    };
  },
};
