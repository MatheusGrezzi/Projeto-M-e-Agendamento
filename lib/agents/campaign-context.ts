import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getClient } from "@/services/clients-repository";
import { listEquipment, listSegments } from "@/services/catalog-repository";
import { listClientExcludedEquipment } from "@/services/client-equipment-repository";
import { listClientExcludedServices, listClientServiceOfferings } from "@/services/client-services-repository";
import { listClientLocations } from "@/services/client-locations-repository";
import { listClientLandingPages } from "@/services/client-landing-pages-repository";
import { listClientConversions } from "@/services/client-conversions-repository";
import { listClientBrandStatuses } from "@/services/client-brands-repository";
import type {
  CampaignObjective,
  Client,
  ClientBrandStatus,
  ClientConversion,
  ClientExcludedEquipment,
  ClientExcludedService,
  ClientLandingPage,
  ClientLocation,
  ClientServiceOffering,
  Segment,
} from "@/types";

/**
 * CampaignContext — the single consolidated object every downstream agent
 * (Estrategista now, Auditor/Executor/QA later) reads from. Built exclusively
 * from what the client has registered in Reconnect OS — never partially,
 * never from user free-text. This is the one place that assembles it; no
 * other module should reach into the client-domain repositories to build an
 * equivalent object by hand.
 */
export interface CampaignContext {
  campaignId: string;
  client: Client;
  selectedSegment: Segment;
  selectedEquipment: { id: string; name: string }[];
  selectedServices: ClientServiceOffering[];
  excludedEquipment: ClientExcludedEquipment[];
  excludedServices: ClientExcludedService[];
  allowedBrands: ClientBrandStatus[];
  excludedBrands: ClientBrandStatus[];
  locations: ClientLocation[];
  excludedLocations: ClientLocation[];
  selectedConversions: ClientConversion[];
  availableLandingPages: ClientLandingPage[];
  selectedLandingPages: ClientLandingPage[];
  budget: { daily: number; monthlyEstimate: number };
  goals: {
    averageTicket: number | null;
    leadGoal: number | null;
    cplGoal: number | null;
    closedServicesGoal: number | null;
    cpaGoal: number | null;
    roasGoal: number | null;
  };
  objective: CampaignObjective;
  notes: string | null;
  /** Reserved for Fase 5 (base de conhecimento / aprendizados) — always empty until then. */
  knowledge: never[];
  learnings: never[];
}

export interface CampaignContextSelection {
  campaignId: string;
  clientId: string;
  segmentId: string;
  equipmentIds: string[];
  clientServiceIds: string[];
  clientLocationIds: string[];
  conversionIds: string[];
  landingPageIds: string[];
  dailyBudget: number;
  objective: CampaignObjective;
  notes: string | null;
}

const MONTHLY_FACTOR = 30.4;

export async function buildCampaignContext(supabase: SupabaseClient, selection: CampaignContextSelection): Promise<CampaignContext> {
  const client = await getClient(supabase, selection.clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  const [segments, allEquipment, allOfferings, allLocations, landingPages, allConversions, brandStatuses, excludedEquipment, excludedServices] =
    await Promise.all([
      listSegments(supabase),
      listEquipment(supabase, client.organizationId),
      listClientServiceOfferings(supabase, selection.clientId),
      listClientLocations(supabase, selection.clientId),
      listClientLandingPages(supabase, selection.clientId),
      listClientConversions(supabase, selection.clientId),
      listClientBrandStatuses(supabase, selection.clientId),
      listClientExcludedEquipment(supabase, selection.clientId),
      listClientExcludedServices(supabase, selection.clientId),
    ]);

  const selectedSegment = segments.find((s) => s.id === selection.segmentId);
  if (!selectedSegment) throw new Error("Segmento inválido.");

  return {
    campaignId: selection.campaignId,
    client,
    selectedSegment,
    selectedEquipment: allEquipment.filter((e) => selection.equipmentIds.includes(e.id)).map((e) => ({ id: e.id, name: e.name })),
    selectedServices: allOfferings.filter((o) => selection.clientServiceIds.includes(o.id)),
    excludedEquipment,
    excludedServices,
    allowedBrands: brandStatuses.filter((b) => b.status === "served"),
    excludedBrands: brandStatuses.filter((b) => b.status === "not_served"),
    locations: allLocations.filter((l) => selection.clientLocationIds.includes(l.id) && l.isServed),
    excludedLocations: allLocations.filter((l) => !l.isServed),
    selectedConversions: allConversions.filter((c) => selection.conversionIds.includes(c.id)),
    availableLandingPages: landingPages.filter((lp) => lp.status === "active"),
    selectedLandingPages: landingPages.filter((lp) => selection.landingPageIds.includes(lp.id)),
    budget: { daily: selection.dailyBudget, monthlyEstimate: Math.round(selection.dailyBudget * MONTHLY_FACTOR * 100) / 100 },
    goals: {
      averageTicket: client.averageTicket,
      leadGoal: client.leadGoal,
      cplGoal: client.cplGoal,
      closedServicesGoal: client.closedServicesGoal,
      cpaGoal: client.cpaGoal,
      roasGoal: client.roasGoal,
    },
    objective: selection.objective,
    notes: selection.notes,
    knowledge: [],
    learnings: [],
  };
}
