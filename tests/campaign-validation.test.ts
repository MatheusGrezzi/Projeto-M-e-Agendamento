import { describe, expect, it } from "vitest";

import { validateCampaignContext, validateGeneratedStrategy } from "@/lib/agents/campaign-validation";
import {
  fixtureCampaignContext,
  fixtureExcludedEquipment,
  fixtureExcludedService,
  fixtureLocation,
} from "./helpers/campaign-context-fixture";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";

describe("validateCampaignContext — blocking errors", () => {
  it("passes for a fully valid context (no errors)", () => {
    const { errors } = validateCampaignContext(fixtureCampaignContext());
    expect(errors).toEqual([]);
  });

  it("BLOCKS when the selected service is excluded for that exact equipment+service combo", () => {
    const context = fixtureCampaignContext({
      excludedServices: [fixtureExcludedService({ equipmentId: "equip-geladeira", serviceId: "service-conserto" })],
    });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("restrição"))).toBe(true);
  });

  it("BLOCKS when the selected equipment itself is excluded", () => {
    const context = fixtureCampaignContext({
      excludedEquipment: [fixtureExcludedEquipment({ equipmentId: "equip-geladeira", equipmentName: "Geladeira" })],
    });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.toLowerCase().includes("não atendido"))).toBe(true);
  });

  it("BLOCKS when a selected location is not served", () => {
    const context = fixtureCampaignContext({ locations: [fixtureLocation({ isServed: false })] });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("não é uma região atendida"))).toBe(true);
  });

  it("BLOCKS when the client is paused or churned", () => {
    const context = fixtureCampaignContext({ client: fixtureCampaignContext().client });
    context.client.status = "paused";
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("status"))).toBe(true);
  });

  it("BLOCKS when the daily budget is zero or negative", () => {
    const context = fixtureCampaignContext({ budget: { daily: 0, monthlyEstimate: 0 } });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("orçamento"))).toBe(true);
  });

  it("BLOCKS when no equipment/service combination was selected", () => {
    const context = fixtureCampaignContext({ selectedServices: [] });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("Nenhuma combinação"))).toBe(true);
  });

  it("BLOCKS when no location was selected", () => {
    const context = fixtureCampaignContext({ locations: [] });
    const { errors } = validateCampaignContext(context);
    expect(errors.some((e) => e.includes("Nenhuma região válida"))).toBe(true);
  });
});

describe("validateCampaignContext — warnings (never block)", () => {
  it("warns but does not block when there is no landing page for a selected service", () => {
    const context = fixtureCampaignContext({ selectedLandingPages: [], availableLandingPages: [] });
    const { errors, warnings } = validateCampaignContext(context);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.toLowerCase().includes("landing page"))).toBe(true);
  });

  it("warns when no conversions are selected", () => {
    const { errors, warnings } = validateCampaignContext(fixtureCampaignContext({ selectedConversions: [] }));
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.toLowerCase().includes("conversão"))).toBe(true);
  });

  it("warns when the objective has no matching conversion type selected", () => {
    const { warnings } = validateCampaignContext(fixtureCampaignContext({ objective: "forms", selectedConversions: [] }));
    expect(warnings.some((w) => w.includes("forms"))).toBe(true);
  });

  it("warns when average ticket is not informed", () => {
    const context = fixtureCampaignContext();
    context.goals.averageTicket = null;
    const { warnings } = validateCampaignContext(context);
    expect(warnings.some((w) => w.includes("Ticket médio"))).toBe(true);
  });
});

function minimalValidStrategy(overrides: Partial<CampaignStrategy> = {}): CampaignStrategy {
  return {
    meta: { schema_version: "1.0", campaign_type: "search", generated_at: new Date().toISOString(), client_id: "client-1", campaign_id: "campaign-1" },
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
        ads: [{ headlines: ["Geladeira com problema?", "Conserto rápido", "Frio Fácil", "Atendimento hoje"], descriptions: ["Especialistas em conserto.", "Peça um orçamento agora."] }],
      },
    ],
    campaign_negatives: [],
    assets: { sitelinks: [], callouts: [], structured_snippets: [] },
    warnings: [],
    assumptions: [],
    strategy_summary: "Estratégia de teste.",
    ...overrides,
  };
}

describe("validateGeneratedStrategy — post-generation safety net", () => {
  it("accepts a strategy that only uses selected equipment/services/locations", () => {
    const errors = validateGeneratedStrategy(minimalValidStrategy(), fixtureCampaignContext());
    expect(errors).toEqual([]);
  });

  it("rejects a strategy that references equipment outside the selection (hallucination)", () => {
    const strategy = minimalValidStrategy({
      ad_groups: [{ ...minimalValidStrategy().ad_groups[0], equipment: "Micro-ondas" }],
    });
    const errors = validateGeneratedStrategy(strategy, fixtureCampaignContext());
    expect(errors.some((e) => e.includes("Micro-ondas"))).toBe(true);
  });

  it("rejects a strategy that includes a region the client excluded", () => {
    const context = fixtureCampaignContext({ excludedLocations: [fixtureLocation({ id: "loc-2", city: "Igarapé", isServed: false })] });
    const strategy = minimalValidStrategy({ locations: { included: ["Igarapé"], excluded: [] } });
    const errors = validateGeneratedStrategy(strategy, context);
    expect(errors.some((e) => e.includes("Igarapé"))).toBe(true);
  });
});
