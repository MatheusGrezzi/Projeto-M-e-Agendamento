import type { CampaignContext } from "@/lib/agents/campaign-context";
import type {
  Client,
  ClientConversion,
  ClientExcludedEquipment,
  ClientExcludedService,
  ClientLandingPage,
  ClientLocation,
  ClientServiceOffering,
} from "@/types";

export function fixtureClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "11111111-1111-4111-8111-111111111111",
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
    averageTicket: 250,
    leadGoal: 30,
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

export function fixtureOffering(overrides: Partial<ClientServiceOffering> = {}): ClientServiceOffering {
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

export function fixtureLocation(overrides: Partial<ClientLocation> = {}): ClientLocation {
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

export function fixtureLandingPage(overrides: Partial<ClientLandingPage> = {}): ClientLandingPage {
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

export function fixtureConversion(overrides: Partial<ClientConversion> = {}): ClientConversion {
  return {
    id: "conv-1",
    clientId: "client-1",
    name: "Clique no WhatsApp",
    platform: "Google Ads",
    conversionType: "whatsapp",
    externalId: null,
    status: "active",
    isPrimary: true,
    notes: null,
    ...overrides,
  };
}

export function fixtureExcludedEquipment(overrides: Partial<ClientExcludedEquipment> = {}): ClientExcludedEquipment {
  return {
    id: "ex-equip-1",
    clientId: "client-1",
    equipmentId: null,
    equipmentName: null,
    label: null,
    notes: null,
    ...overrides,
  };
}

export function fixtureExcludedService(overrides: Partial<ClientExcludedService> = {}): ClientExcludedService {
  return {
    id: "ex-service-1",
    clientId: "client-1",
    equipmentId: null,
    equipmentName: null,
    serviceId: null,
    serviceName: null,
    label: null,
    notes: null,
    ...overrides,
  };
}

export function fixtureCampaignContext(overrides: Partial<CampaignContext> = {}): CampaignContext {
  return {
    campaignId: "22222222-2222-4222-8222-222222222222",
    client: fixtureClient(),
    selectedSegment: { id: "seg-1", key: "refrigeracao_domestica", label: "Refrigeração doméstica" },
    selectedEquipment: [{ id: "equip-geladeira", name: "Geladeira" }],
    selectedServices: [fixtureOffering()],
    excludedEquipment: [],
    excludedServices: [],
    allowedBrands: [],
    excludedBrands: [],
    locations: [fixtureLocation()],
    excludedLocations: [],
    selectedConversions: [fixtureConversion()],
    availableLandingPages: [fixtureLandingPage()],
    selectedLandingPages: [fixtureLandingPage()],
    budget: { daily: 100, monthlyEstimate: 3040 },
    goals: { averageTicket: 250, leadGoal: 30, cplGoal: null, closedServicesGoal: null, cpaGoal: null, roasGoal: null },
    objective: "whatsapp",
    notes: null,
    knowledge: [],
    learnings: [],
    ...overrides,
  };
}
