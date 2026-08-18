import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { placeholderStrategistEngine, type StrategistAdGroupRecord, type StrategistInput } from "@/lib/agents/strategist";
import {
  campaignFromRow,
  campaignListItemFromRow,
  campaignVersionFromRow,
  type CampaignListItemRow,
  type CampaignRow,
  type CampaignVersionRow,
} from "@/lib/mappers";
import type { Campaign, CampaignAdGroupRow, CampaignListItem, CampaignObjective, CampaignVersion, StrategyJson, StrategyKeyword } from "@/types";
import { getClient } from "@/services/clients-repository";
import { listEquipment, listSegments } from "@/services/catalog-repository";
import { listClientExcludedEquipment } from "@/services/client-equipment-repository";
import { listClientExcludedServices, listClientServiceOfferings } from "@/services/client-services-repository";
import { listClientLocations } from "@/services/client-locations-repository";
import { listClientLandingPages } from "@/services/client-landing-pages-repository";
import { listClientConversions } from "@/services/client-conversions-repository";

const CAMPAIGN_LIST_SELECT = "id, name, objective, daily_budget, status, created_at, client:clients(id, name, trade_name), segment:segments(label)";

export async function listCampaigns(supabase: SupabaseClient, organizationId: string): Promise<CampaignListItem[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(`${CAMPAIGN_LIST_SELECT}, clients!inner(organization_id)`)
    .eq("clients.organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar campanhas: ${error.message}`);
  return (data as unknown as CampaignListItemRow[]).map(campaignListItemFromRow);
}

export async function listCampaignsForClient(supabase: SupabaseClient, clientId: string): Promise<CampaignListItem[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_LIST_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar campanhas do cliente: ${error.message}`);
  return (data as unknown as CampaignListItemRow[]).map(campaignListItemFromRow);
}

export async function getCampaign(supabase: SupabaseClient, campaignId: string): Promise<Campaign | null> {
  const { data, error } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (error) throw new Error(`Falha ao carregar campanha: ${error.message}`);
  return data ? campaignFromRow(data as CampaignRow) : null;
}

export async function getLatestCampaignVersion(supabase: SupabaseClient, campaignId: string): Promise<CampaignVersion | null> {
  const { data, error } = await supabase
    .from("campaign_versions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar versão da estratégia: ${error.message}`);
  return data ? campaignVersionFromRow(data as CampaignVersionRow) : null;
}

export async function listCampaignVersions(supabase: SupabaseClient, campaignId: string): Promise<CampaignVersion[]> {
  const { data, error } = await supabase
    .from("campaign_versions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(`Falha ao carregar versões da estratégia: ${error.message}`);
  return (data as CampaignVersionRow[]).map(campaignVersionFromRow);
}

export async function getCampaignAdGroups(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignAdGroupRow[]> {
  const { data, error } = await supabase
    .from("campaign_ad_groups")
    .select("id, name, headlines, descriptions, landing_page:client_landing_pages(url), campaign_keywords(keyword, match_type)")
    .eq("campaign_version_id", campaignVersionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Falha ao carregar grupos de anúncio: ${error.message}`);

  return (
    data as unknown as {
      id: string;
      name: string;
      headlines: string[];
      descriptions: string[];
      landing_page: { url: string } | null;
      campaign_keywords: { keyword: string; match_type: StrategyKeyword["match_type"] }[];
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    landingPageUrl: row.landing_page?.url ?? null,
    headlines: row.headlines,
    descriptions: row.descriptions,
    keywords: row.campaign_keywords.map((k) => ({ keyword: k.keyword, match_type: k.match_type })),
  }));
}

export async function getCampaignNegatives(supabase: SupabaseClient, campaignVersionId: string): Promise<StrategyKeyword[]> {
  const { data, error } = await supabase
    .from("campaign_negatives")
    .select("keyword, match_type")
    .eq("campaign_version_id", campaignVersionId);
  if (error) throw new Error(`Falha ao carregar palavras negativas: ${error.message}`);
  return data as StrategyKeyword[];
}

export interface WizardEquipmentOption {
  id: string;
  name: string;
  segmentId: string;
}

export interface WizardServiceOption {
  id: string;
  equipmentId: string;
  equipmentName: string;
  serviceId: string;
  serviceName: string;
}

export interface WizardLocationOption {
  id: string;
  city: string;
  state: string;
  priority: string | null;
}

export interface WizardClientData {
  id: string;
  name: string;
  displayName: string;
  dailyBudget: number | null;
  segmentIds: string[];
  equipment: WizardEquipmentOption[];
  serviceOfferings: WizardServiceOption[];
  locations: WizardLocationOption[];
}

/** Everything the /campanhas/nova wizard needs, prefetched per client so each step is a client-side filter (no extra round-trips). */
export async function getWizardClientsData(supabase: SupabaseClient, organizationId: string): Promise<WizardClientData[]> {
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(
      `id, name, trade_name, daily_budget,
       client_segments(segment_id),
       client_equipment(equipment:equipment(id, name, segment_id)),
       client_services(id, equipment:equipment(id, name), service:services(id, name)),
       client_locations(id, city, state, priority, is_served)`
    )
    .eq("organization_id", organizationId)
    .order("name");

  if (clientsError) throw new Error(`Falha ao carregar clientes para o assistente de campanha: ${clientsError.message}`);

  type Row = {
    id: string;
    name: string;
    trade_name: string | null;
    daily_budget: number | null;
    client_segments: { segment_id: string }[];
    client_equipment: { equipment: { id: string; name: string; segment_id: string } | null }[];
    client_services: { id: string; equipment: { id: string; name: string } | null; service: { id: string; name: string } | null }[];
    client_locations: { id: string; city: string; state: string; priority: string | null; is_served: boolean }[];
  };

  return (clients as unknown as Row[]).map((c) => ({
    id: c.id,
    name: c.name,
    displayName: c.trade_name || c.name,
    dailyBudget: c.daily_budget,
    segmentIds: c.client_segments.map((s) => s.segment_id),
    equipment: c.client_equipment
      .filter((e) => e.equipment)
      .map((e) => ({ id: e.equipment!.id, name: e.equipment!.name, segmentId: e.equipment!.segment_id })),
    serviceOfferings: c.client_services
      .filter((s) => s.equipment && s.service)
      .map((s) => ({
        id: s.id,
        equipmentId: s.equipment!.id,
        equipmentName: s.equipment!.name,
        serviceId: s.service!.id,
        serviceName: s.service!.name,
      })),
    locations: c.client_locations
      .filter((l) => l.is_served)
      .map((l) => ({ id: l.id, city: l.city, state: l.state, priority: l.priority })),
  }));
}

/** Loads every input the strategist needs for a given client + briefing selection. Shared by create and regenerate. */
async function buildStrategistInput(
  supabase: SupabaseClient,
  clientId: string,
  segmentId: string,
  equipmentIds: string[],
  clientServiceIds: string[],
  clientLocationIds: string[],
  campaignName: string,
  objective: CampaignObjective,
  dailyBudget: number,
  notes: string | null
): Promise<StrategistInput> {
  const client = await getClient(supabase, clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  const [segments, allEquipment, allOfferings, allLocations, landingPages, conversions, excludedEquipment, excludedServices] =
    await Promise.all([
      listSegments(supabase),
      listEquipment(supabase, client.organizationId),
      listClientServiceOfferings(supabase, clientId),
      listClientLocations(supabase, clientId),
      listClientLandingPages(supabase, clientId),
      listClientConversions(supabase, clientId),
      listClientExcludedEquipment(supabase, clientId),
      listClientExcludedServices(supabase, clientId),
    ]);

  const segment = segments.find((s) => s.id === segmentId);
  if (!segment) throw new Error("Segmento inválido.");

  const serviceOfferings = allOfferings.filter((o) => clientServiceIds.includes(o.id));
  const locations = allLocations.filter((l) => clientLocationIds.includes(l.id) && l.isServed);
  if (serviceOfferings.length === 0) throw new Error("Selecione ao menos um serviço.");
  if (locations.length === 0) throw new Error("Selecione ao menos uma região.");

  return {
    client,
    campaignName,
    segmentLabel: segment.label,
    equipment: allEquipment.filter((e) => equipmentIds.includes(e.id)),
    serviceOfferings,
    locations,
    allExcludedLocations: allLocations.filter((l) => !l.isServed),
    landingPages,
    conversions,
    excludedEquipment,
    excludedServices,
    objective,
    dailyBudget,
    notes,
  };
}

/** Inserts a campaign_versions row plus its exploded ad_groups/keywords/negatives/assets. Shared by create and regenerate. */
async function persistStrategyVersion(
  supabase: SupabaseClient,
  campaignId: string,
  versionNumber: number,
  strategy: StrategyJson,
  warnings: string[],
  adGroupRecords: StrategistAdGroupRecord[],
  userId: string
): Promise<void> {
  const { data: version, error: versionError } = await supabase
    .from("campaign_versions")
    .insert({
      campaign_id: campaignId,
      version_number: versionNumber,
      strategy_json: strategy,
      warnings,
      reasoning_summary: strategy.reasoning_summary,
      generated_by: "placeholder_engine",
      created_by: userId,
    })
    .select("id")
    .single();
  if (versionError) throw new Error(`Falha ao salvar estratégia: ${versionError.message}`);
  const versionId = version.id as string;

  for (const record of adGroupRecords) {
    const { data: adGroup, error: adGroupError } = await supabase
      .from("campaign_ad_groups")
      .insert({
        campaign_version_id: versionId,
        name: record.name,
        equipment_id: record.equipmentId,
        service_id: record.serviceId,
        landing_page_id: record.landingPageId,
        headlines: record.headlines,
        descriptions: record.descriptions,
      })
      .select("id")
      .single();
    if (adGroupError) throw new Error(`Falha ao salvar grupo de anúncio: ${adGroupError.message}`);

    if (record.keywords.length > 0) {
      const { error: keywordsError } = await supabase
        .from("campaign_keywords")
        .insert(record.keywords.map((k) => ({ ad_group_id: adGroup.id, keyword: k.keyword, match_type: k.match_type })));
      if (keywordsError) throw new Error(`Falha ao salvar palavras-chave: ${keywordsError.message}`);
    }
  }

  if (strategy.campaign_negatives.length > 0) {
    const { error: negativesError } = await supabase
      .from("campaign_negatives")
      .insert(strategy.campaign_negatives.map((k) => ({ campaign_version_id: versionId, keyword: k.keyword, match_type: k.match_type })));
    if (negativesError) throw new Error(`Falha ao salvar palavras negativas: ${negativesError.message}`);
  }

  if (strategy.assets.length > 0) {
    const { error: assetsError } = await supabase
      .from("campaign_assets")
      .insert(strategy.assets.map((content) => ({ campaign_version_id: versionId, content })));
    if (assetsError) throw new Error(`Falha ao salvar ativos: ${assetsError.message}`);
  }
}

export interface CreateCampaignInput {
  clientId: string;
  name: string;
  segmentId: string;
  equipmentIds: string[];
  clientServiceIds: string[];
  clientLocationIds: string[];
  dailyBudget: number;
  objective: CampaignObjective;
  notes: string | null;
}

/** Passos 1-8 do wizard + "GERAR ESTRATÉGIA": cria a campanha (draft) e já gera a versão 1 da estratégia. */
export async function createCampaignWithStrategy(
  supabase: SupabaseClient,
  input: CreateCampaignInput,
  userId: string
): Promise<{ campaignId: string; warnings: string[] }> {
  const strategistInput = await buildStrategistInput(
    supabase,
    input.clientId,
    input.segmentId,
    input.equipmentIds,
    input.clientServiceIds,
    input.clientLocationIds,
    input.name,
    input.objective,
    input.dailyBudget,
    input.notes
  );
  const { strategy, warnings, adGroupRecords } = placeholderStrategistEngine(strategistInput);

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      client_id: input.clientId,
      name: input.name,
      segment_id: input.segmentId,
      objective: input.objective,
      daily_budget: input.dailyBudget,
      notes: input.notes,
      status: "strategy_generated",
    })
    .select("id")
    .single();
  if (campaignError) throw new Error(`Falha ao criar campanha: ${campaignError.message}`);
  const campaignId = campaign.id as string;

  const [equipmentRows, serviceRows, locationRows] = await Promise.all([
    input.equipmentIds.length > 0
      ? supabase.from("campaign_equipment").insert(input.equipmentIds.map((equipment_id) => ({ campaign_id: campaignId, equipment_id })))
      : Promise.resolve({ error: null }),
    supabase
      .from("campaign_services")
      .insert(input.clientServiceIds.map((client_service_id) => ({ campaign_id: campaignId, client_service_id }))),
    supabase
      .from("campaign_locations")
      .insert(input.clientLocationIds.map((client_location_id) => ({ campaign_id: campaignId, client_location_id }))),
  ]);
  if (equipmentRows.error) throw new Error(`Falha ao salvar equipamentos da campanha: ${equipmentRows.error.message}`);
  if (serviceRows.error) throw new Error(`Falha ao salvar serviços da campanha: ${serviceRows.error.message}`);
  if (locationRows.error) throw new Error(`Falha ao salvar regiões da campanha: ${locationRows.error.message}`);

  await persistStrategyVersion(supabase, campaignId, 1, strategy, warnings, adGroupRecords, userId);

  return { campaignId, warnings };
}

/** Re-runs the strategist against the campaign's original briefing (passos 1-8 são imutáveis após criada) e guarda como nova versão. */
export async function regenerateCampaignStrategy(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string
): Promise<{ warnings: string[] }> {
  const campaign = await getCampaign(supabase, campaignId);
  if (!campaign) throw new Error("Campanha não encontrada.");

  const [
    { data: campaignEquipmentRows, error: ceError },
    { data: campaignServiceRows, error: csError },
    { data: campaignLocationRows, error: clError },
    { data: latestVersion, error: lvError },
  ] = await Promise.all([
    supabase.from("campaign_equipment").select("equipment_id").eq("campaign_id", campaignId),
    supabase.from("campaign_services").select("client_service_id").eq("campaign_id", campaignId),
    supabase.from("campaign_locations").select("client_location_id").eq("campaign_id", campaignId),
    supabase
      .from("campaign_versions")
      .select("version_number")
      .eq("campaign_id", campaignId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (ceError) throw new Error(`Falha ao carregar equipamentos da campanha: ${ceError.message}`);
  if (csError) throw new Error(`Falha ao carregar serviços da campanha: ${csError.message}`);
  if (clError) throw new Error(`Falha ao carregar regiões da campanha: ${clError.message}`);
  if (lvError) throw new Error(`Falha ao carregar versão anterior: ${lvError.message}`);

  const strategistInput = await buildStrategistInput(
    supabase,
    campaign.clientId,
    campaign.segmentId,
    (campaignEquipmentRows as { equipment_id: string }[]).map((r) => r.equipment_id),
    (campaignServiceRows as { client_service_id: string }[]).map((r) => r.client_service_id),
    (campaignLocationRows as { client_location_id: string }[]).map((r) => r.client_location_id),
    campaign.name,
    campaign.objective,
    campaign.dailyBudget,
    campaign.notes
  );
  const { strategy, warnings, adGroupRecords } = placeholderStrategistEngine(strategistInput);

  const nextVersionNumber = ((latestVersion as { version_number: number } | null)?.version_number ?? 0) + 1;
  await persistStrategyVersion(supabase, campaignId, nextVersionNumber, strategy, warnings, adGroupRecords, userId);

  const { error: statusError } = await supabase.from("campaigns").update({ status: "strategy_generated" }).eq("id", campaignId);
  if (statusError) throw new Error(`Falha ao atualizar status: ${statusError.message}`);

  return { warnings };
}
