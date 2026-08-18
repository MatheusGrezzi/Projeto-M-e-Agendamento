import { describe, expect, it } from "vitest";

import { placeholderStrategistEngine, type StrategistInput } from "@/lib/agents/strategist";
import type { Client, ClientLandingPage, ClientLocation, ClientServiceOffering } from "@/types";

function baseClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    organizationId: "org-1",
    name: "Assistência Frio Fácil Ltda",
    tradeName: "Frio Fácil",
    cnpj: null,
    website: null,
    whatsapp: "5531999999999",
    phone: null,
    email: null,
    businessHours: null,
    notes: null,
    status: "active",
    primaryCity: "Betim",
    primaryState: "MG",
    dailyBudget: 100,
    monthlyBudgetEstimate: null,
    averageTicket: null,
    leadGoal: null,
    cplGoal: null,
    closedServicesGoal: null,
    cpaGoal: null,
    roasGoal: null,
    brandPolicy: "no_restriction",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function offering(overrides: Partial<ClientServiceOffering> = {}): ClientServiceOffering {
  return {
    id: "offering-1",
    clientId: "client-1",
    equipmentId: "equip-geladeira",
    equipmentName: "Geladeira",
    serviceId: "service-conserto",
    serviceName: "Conserto",
    notes: null,
    ...overrides,
  };
}

function location(overrides: Partial<ClientLocation> = {}): ClientLocation {
  return {
    id: "loc-1",
    clientId: "client-1",
    city: "Betim",
    state: "MG",
    neighborhood: null,
    priority: "muito_alta",
    isServed: true,
    ...overrides,
  };
}

function landingPage(overrides: Partial<ClientLandingPage> = {}): ClientLandingPage {
  return {
    id: "lp-1",
    clientId: "client-1",
    name: "Conserto de Geladeira Betim",
    url: "https://friofacil.com/conserto-geladeira-betim",
    segmentId: null,
    equipmentId: "equip-geladeira",
    serviceId: "service-conserto",
    city: "Betim",
    status: "active",
    ...overrides,
  };
}

function baseInput(overrides: Partial<StrategistInput> = {}): StrategistInput {
  return {
    client: baseClient(),
    campaignName: "Campanha Geladeira Betim",
    segmentLabel: "Refrigeração doméstica",
    equipment: [{ id: "equip-geladeira", name: "Geladeira" }],
    serviceOfferings: [offering()],
    locations: [location()],
    allExcludedLocations: [],
    landingPages: [landingPage()],
    conversions: [
      {
        id: "conv-1",
        clientId: "client-1",
        name: "Clique no WhatsApp",
        platform: "Google Ads",
        conversionType: "whatsapp",
        externalId: null,
        status: "active",
        isPrimary: true,
        notes: null,
      },
    ],
    excludedEquipment: [],
    excludedServices: [],
    objective: "whatsapp",
    dailyBudget: 100,
    notes: null,
    ...overrides,
  };
}

describe("placeholderStrategistEngine", () => {
  it("builds one ad group per valid service offering with a matching landing page", () => {
    const { strategy, warnings } = placeholderStrategistEngine(baseInput());

    expect(strategy.ad_groups).toHaveLength(1);
    expect(strategy.ad_groups[0].landing_page).toBe("https://friofacil.com/conserto-geladeira-betim");
    expect(strategy.ad_groups[0].keywords.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes("Sem landing page"))).toBe(false);
  });

  it("never includes a service the client marked as not attended (excluded equipment)", () => {
    const { strategy, warnings } = placeholderStrategistEngine(
      baseInput({
        excludedEquipment: [{ id: "ex-1", clientId: "client-1", equipmentId: "equip-geladeira", equipmentName: "Geladeira", label: null, notes: null }],
      })
    );

    expect(strategy.ad_groups).toHaveLength(0);
    expect(warnings.some((w) => w.includes("restrição"))).toBe(true);
  });

  it("never includes a specific equipment+service combo the client excluded", () => {
    const { strategy } = placeholderStrategistEngine(
      baseInput({
        excludedServices: [
          {
            id: "ex-1",
            clientId: "client-1",
            equipmentId: "equip-geladeira",
            equipmentName: "Geladeira",
            serviceId: "service-conserto",
            serviceName: "Conserto",
            label: null,
            notes: null,
          },
        ],
      })
    );

    expect(strategy.ad_groups).toHaveLength(0);
  });

  it("warns when no landing page matches the equipment/service", () => {
    const { warnings } = placeholderStrategistEngine(baseInput({ landingPages: [] }));
    expect(warnings.some((w) => w.includes("Sem landing page"))).toBe(true);
  });

  it("warns when the client has no active conversions", () => {
    const { warnings } = placeholderStrategistEngine(baseInput({ conversions: [] }));
    expect(warnings.some((w) => w.toLowerCase().includes("conversão"))).toBe(true);
  });

  it("always includes a baseline of non-commercial negative keywords", () => {
    const { strategy } = placeholderStrategistEngine(baseInput());
    const negatives = strategy.campaign_negatives.map((k) => k.keyword);
    expect(negatives).toContain("curso");
    expect(negatives).toContain("comprar peça");
  });

  it("lists excluded (not served) regions separately from targeted locations", () => {
    const { strategy } = placeholderStrategistEngine(
      baseInput({ allExcludedLocations: [location({ id: "loc-2", city: "Igarapé", isServed: false })] })
    );
    expect(strategy.locations).toEqual(["Betim"]);
    expect(strategy.excluded_locations).toEqual(["Igarapé/MG"]);
  });
});
