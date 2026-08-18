/**
 * Agente 01 — Estrategista.
 *
 * `StrategistEngine` is the swap point for a real LLM integration later
 * (Fase 2 ships `placeholderStrategistEngine`, a deterministic/rule-based
 * generator — no external API, no cost, no key required). Whatever engine
 * runs, the contract is the same: take a validated briefing built entirely
 * from what THIS client is registered to attend, and return a StrategyJson.
 *
 * The caller (services/campaigns-repository.ts) is responsible for never
 * building `equipment`/`serviceOfferings`/`locations` from anything other
 * than the client's own client_equipment/client_services/client_locations —
 * this module still re-checks against the exclusion tables as a second
 * line of defense, per the briefing's "nunca incluir X não atendido" rule.
 */

import type {
  Client,
  ClientConversion,
  ClientExcludedEquipment,
  ClientExcludedService,
  ClientLandingPage,
  ClientLocation,
  ClientServiceOffering,
  CampaignObjective,
  KeywordMatchType,
  StrategyAdGroup,
  StrategyJson,
  StrategyKeyword,
} from "@/types";

export interface StrategistInput {
  client: Client;
  campaignName: string;
  segmentLabel: string;
  equipment: { id: string; name: string }[];
  serviceOfferings: ClientServiceOffering[];
  locations: ClientLocation[];
  allExcludedLocations: ClientLocation[];
  landingPages: ClientLandingPage[];
  conversions: ClientConversion[];
  excludedEquipment: ClientExcludedEquipment[];
  excludedServices: ClientExcludedService[];
  objective: CampaignObjective;
  dailyBudget: number;
  notes: string | null;
}

/** DB-insertable ad group — mirrors a StrategyAdGroup but keeps ids instead of names, since the public JSON is name-only per the briefing's schema. */
export interface StrategistAdGroupRecord {
  name: string;
  equipmentId: string;
  serviceId: string;
  landingPageId: string | null;
  keywords: StrategyKeyword[];
  headlines: string[];
  descriptions: string[];
}

export interface StrategistOutput {
  strategy: StrategyJson;
  warnings: string[];
  adGroupRecords: StrategistAdGroupRecord[];
}

export type StrategistEngine = (input: StrategistInput) => StrategistOutput;

const NEGATIVE_KEYWORDS: string[] = [
  "curso",
  "apostila",
  "manual pdf",
  "como consertar sozinho",
  "passo a passo",
  "diy",
  "emprego",
  "vaga",
  "currículo",
  "comprar peça",
  "peça avulsa",
  "revenda",
  "atacado",
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function isExcluded(
  equipmentId: string,
  serviceId: string,
  excludedEquipment: ClientExcludedEquipment[],
  excludedServices: ClientExcludedService[]
): boolean {
  if (excludedEquipment.some((e) => e.equipmentId === equipmentId)) return true;
  return excludedServices.some(
    (s) => (s.equipmentId === equipmentId || s.equipmentId === null) && (s.serviceId === serviceId || s.serviceId === null)
  );
}

function findLandingPage(
  landingPages: ClientLandingPage[],
  equipmentId: string,
  serviceId: string,
  cities: string[]
): ClientLandingPage | null {
  const active = landingPages.filter((lp) => lp.status === "active");
  const exact = active.find(
    (lp) => lp.equipmentId === equipmentId && lp.serviceId === serviceId && (lp.city ? cities.includes(lp.city) : true)
  );
  if (exact) return exact;
  const byEquipmentService = active.find((lp) => lp.equipmentId === equipmentId && lp.serviceId === serviceId);
  if (byEquipmentService) return byEquipmentService;
  const byEquipment = active.find((lp) => lp.equipmentId === equipmentId);
  return byEquipment ?? null;
}

function buildKeywords(serviceName: string, equipmentName: string, cities: string[]): StrategyKeyword[] {
  const service = normalize(serviceName);
  const equipment = normalize(equipmentName);
  const keywords: StrategyKeyword[] = [
    { keyword: `${service} de ${equipment}`, match_type: "phrase" },
    { keyword: `assistência técnica ${equipment}`, match_type: "phrase" },
    { keyword: `técnico de ${equipment}`, match_type: "phrase" },
    { keyword: `${service} ${equipment}`, match_type: "exact" as KeywordMatchType },
  ];

  for (const city of cities.slice(0, 3)) {
    keywords.push({ keyword: `${service} de ${equipment} em ${normalize(city)}`, match_type: "phrase" });
  }

  return keywords;
}

function buildHeadlines(clientDisplayName: string, serviceName: string, equipmentName: string): string[] {
  return [
    `${equipmentName} com problema? Chamamos já`,
    `${serviceName} de ${equipmentName} com garantia`,
    `${clientDisplayName} — Atendimento rápido`,
    `Agende seu ${normalize(serviceName)} hoje`,
  ];
}

function buildDescriptions(serviceName: string, equipmentName: string, cities: string[]): string[] {
  const cityPart = cities.length > 0 ? `Atendemos ${cities.slice(0, 3).join(", ")}.` : "Atendimento na sua região.";
  return [
    `Especialistas em ${normalize(serviceName)} de ${normalize(equipmentName)}. Atendimento rápido e com garantia.`,
    `Solicite um orçamento agora pelo WhatsApp. ${cityPart}`,
  ];
}

export const placeholderStrategistEngine: StrategistEngine = (input) => {
  const warnings: string[] = [];
  const clientDisplayName = input.client.tradeName || input.client.name;
  const cities = input.locations.map((l) => l.city);

  const validOfferings = input.serviceOfferings.filter((offering) => {
    const excluded = isExcluded(offering.equipmentId, offering.serviceId, input.excludedEquipment, input.excludedServices);
    if (excluded) {
      warnings.push(
        `"${offering.serviceName} de ${offering.equipmentName}" está marcado como restrição deste cliente e foi removido da estratégia.`
      );
    }
    return !excluded;
  });

  if (validOfferings.length === 0) {
    warnings.push("Nenhum serviço válido selecionado — a campanha não pôde gerar grupos de anúncio.");
  }

  if (cities.length === 0) {
    warnings.push("Nenhuma região atendida foi selecionada.");
  }

  const activeConversions = input.conversions.filter((c) => c.status === "active");
  if (activeConversions.length === 0) {
    warnings.push("Nenhuma conversão ativa configurada para este cliente — configure em Conversões antes de aprovar a campanha.");
  }

  const adGroupRecords: StrategistAdGroupRecord[] = validOfferings.map((offering) => {
    const landingPage = findLandingPage(input.landingPages, offering.equipmentId, offering.serviceId, cities);
    if (!landingPage) {
      warnings.push(`Sem landing page cadastrada para "${offering.serviceName} de ${offering.equipmentName}".`);
    }

    return {
      name: `${offering.serviceName} — ${offering.equipmentName}`,
      equipmentId: offering.equipmentId,
      serviceId: offering.serviceId,
      landingPageId: landingPage?.id ?? null,
      keywords: buildKeywords(offering.serviceName, offering.equipmentName, cities),
      headlines: buildHeadlines(clientDisplayName, offering.serviceName, offering.equipmentName),
      descriptions: buildDescriptions(offering.serviceName, offering.equipmentName, cities),
    };
  });

  const landingPageUrlById = new Map(input.landingPages.map((lp) => [lp.id, lp.url]));
  const adGroups: StrategyAdGroup[] = adGroupRecords.map((record) => {
    const offering = validOfferings.find((o) => o.equipmentId === record.equipmentId && o.serviceId === record.serviceId)!;
    return {
      name: record.name,
      service: offering.serviceName,
      equipment: offering.equipmentName,
      landing_page: record.landingPageId ? (landingPageUrlById.get(record.landingPageId) ?? null) : null,
      keywords: record.keywords,
      headlines: record.headlines,
      descriptions: record.descriptions,
    };
  });

  const campaignNegatives: StrategyKeyword[] = NEGATIVE_KEYWORDS.map((keyword) => ({ keyword, match_type: "broad" }));

  const assets = [
    input.client.whatsapp ? `Fale pelo WhatsApp: ${input.client.whatsapp}` : null,
    "Orçamento sem compromisso",
    input.client.primaryCity ? `Atendimento em ${input.client.primaryCity}` : null,
  ].filter((a): a is string => Boolean(a));

  const reasoningSummary =
    `Gerados ${adGroups.length} grupo(s) de anúncio para o segmento "${input.segmentLabel}", ` +
    `cobrindo ${cities.length} região(ões) com orçamento diário de R$ ${input.dailyBudget.toFixed(2)}. ` +
    `Objetivo: ${input.objective}. ` +
    (warnings.length > 0 ? `${warnings.length} alerta(s) requerem atenção antes da auditoria.` : "Nenhum alerta identificado.");

  const strategy: StrategyJson = {
    campaign_name: input.campaignName,
    segment: input.segmentLabel,
    equipment: input.equipment.map((e) => e.name),
    services: [...new Set(validOfferings.map((o) => o.serviceName))],
    objective: input.objective,
    daily_budget: input.dailyBudget,
    locations: cities,
    excluded_locations: input.allExcludedLocations.map((l) => `${l.city}/${l.state}`),
    conversion_actions: activeConversions.map((c) => c.name),
    ad_groups: adGroups,
    campaign_negatives: campaignNegatives,
    assets,
    warnings,
    reasoning_summary: reasoningSummary,
  };

  return { strategy, warnings, adGroupRecords };
};
