import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { buildCampaignContext, type CampaignContextSelection } from "@/lib/agents/campaign-context";
import { validateCampaignContext, validateGeneratedStrategy } from "@/lib/agents/campaign-validation";
import { getConfiguredAIProvider } from "@/lib/agents/ai-provider";
import { campaignStrategySchema, type CampaignStrategy } from "@/lib/schemas/campaign-strategy";
import {
  campaignFromRow,
  campaignListItemFromRow,
  campaignVersionFromRow,
  type CampaignListItemRow,
  type CampaignRow,
  type CampaignVersionRow,
} from "@/lib/mappers";
import type {
  Campaign,
  CampaignAdGroupRow,
  CampaignAssetsRow,
  CampaignListItem,
  CampaignNegativeRow,
  CampaignObjective,
  CampaignVersion,
} from "@/types";

const CAMPAIGN_LIST_SELECT = "id, name, objective, daily_budget, status, created_at, client:clients(id, name, trade_name), segment:segments(label)";

export async function listCampaigns(supabase: SupabaseClient, organizationId: string): Promise<CampaignListItem[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_LIST_SELECT)
    .eq("organization_id", organizationId)
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

export async function listCampaignVersions(supabase: SupabaseClient, campaignId: string): Promise<CampaignVersion[]> {
  const { data, error } = await supabase
    .from("campaign_versions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(`Falha ao carregar versões da estratégia: ${error.message}`);
  return (data as CampaignVersionRow[]).map(campaignVersionFromRow);
}

export async function getCampaignVersion(supabase: SupabaseClient, versionId: string): Promise<CampaignVersion | null> {
  const { data, error } = await supabase.from("campaign_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw new Error(`Falha ao carregar versão: ${error.message}`);
  return data ? campaignVersionFromRow(data as CampaignVersionRow) : null;
}

export async function getLatestCampaignVersion(supabase: SupabaseClient, campaignId: string): Promise<CampaignVersion | null> {
  const versions = await listCampaignVersions(supabase, campaignId);
  return versions[0] ?? null;
}

export async function getCampaignAdGroups(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignAdGroupRow[]> {
  const { data, error } = await supabase
    .from("campaign_ad_groups")
    .select(
      "id, name, theme, landing_page:client_landing_pages(url), campaign_keywords(text, match_type, intent, reason), campaign_ads(headlines, descriptions, path1, path2)"
    )
    .eq("campaign_version_id", campaignVersionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Falha ao carregar grupos de anúncio: ${error.message}`);

  return (
    data as unknown as {
      id: string;
      name: string;
      theme: string | null;
      landing_page: { url: string } | null;
      campaign_keywords: { text: string; match_type: "exact" | "phrase"; intent: string | null; reason: string | null }[];
      campaign_ads: { headlines: string[]; descriptions: string[]; path1: string | null; path2: string | null }[];
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    theme: row.theme,
    landingPageUrl: row.landing_page?.url ?? null,
    keywords: row.campaign_keywords.map((k) => ({ text: k.text, matchType: k.match_type, intent: k.intent, reason: k.reason })),
    ads: row.campaign_ads.map((a) => ({ headlines: a.headlines, descriptions: a.descriptions, path1: a.path1, path2: a.path2 })),
  }));
}

export async function getCampaignNegatives(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignNegativeRow[]> {
  const { data, error } = await supabase
    .from("campaign_negatives")
    .select("text, match_type, category, reason")
    .eq("campaign_version_id", campaignVersionId);
  if (error) throw new Error(`Falha ao carregar palavras negativas: ${error.message}`);
  return (data as { text: string; match_type: CampaignNegativeRow["matchType"]; category: string; reason: string | null }[]).map((r) => ({
    text: r.text,
    matchType: r.match_type,
    category: r.category,
    reason: r.reason,
  }));
}

export async function getCampaignAssets(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignAssetsRow> {
  const { data, error } = await supabase
    .from("campaign_assets")
    .select("asset_type, content")
    .eq("campaign_version_id", campaignVersionId);
  if (error) throw new Error(`Falha ao carregar ativos: ${error.message}`);

  const rows = data as { asset_type: "sitelink" | "callout" | "structured_snippet"; content: string }[];
  return {
    sitelinks: rows.filter((r) => r.asset_type === "sitelink").map((r) => r.content),
    callouts: rows.filter((r) => r.asset_type === "callout").map((r) => r.content),
    structuredSnippets: rows.filter((r) => r.asset_type === "structured_snippet").map((r) => r.content),
  };
}

// ============================================================
// Wizard data — everything /campanhas/nova needs, prefetched per client.
// ============================================================

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
  isServed: boolean;
}

export interface WizardConversionOption {
  id: string;
  name: string;
  conversionType: string;
  isPrimary: boolean;
}

export interface WizardLandingPageOption {
  id: string;
  name: string;
  url: string;
  equipmentId: string | null;
  serviceId: string | null;
  city: string | null;
}

export interface WizardClientData {
  id: string;
  name: string;
  displayName: string;
  status: string;
  dailyBudget: number | null;
  averageTicket: number | null;
  brandPolicy: string;
  segmentIds: string[];
  equipment: WizardEquipmentOption[];
  serviceOfferings: WizardServiceOption[];
  locations: WizardLocationOption[];
  conversions: WizardConversionOption[];
  landingPages: WizardLandingPageOption[];
  excludedEquipmentLabels: string[];
  excludedServiceLabels: string[];
  excludedBrandNames: string[];
}

/** Everything the /campanhas/nova wizard needs, prefetched per client so each step is a client-side filter (no extra round-trips). */
export async function getWizardClientsData(supabase: SupabaseClient, organizationId: string): Promise<WizardClientData[]> {
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(
      `id, name, trade_name, status, daily_budget, average_ticket, brand_policy,
       client_segments(segment_id),
       client_equipment(equipment:equipment(id, name, segment_id)),
       client_services(id, equipment:equipment(id, name), service:services(id, name)),
       client_locations(id, city, state, priority, is_served),
       client_conversions(id, name, conversion_type, is_primary, status),
       client_landing_pages(id, name, url, equipment_id, service_id, city, status),
       client_excluded_equipment(label, equipment_id, equipment:equipment(name)),
       client_excluded_services(label, equipment_id, service_id, equipment:equipment(name), service:services(name)),
       client_brands(status, brand:brands(name))`
    )
    .eq("organization_id", organizationId)
    .order("name");

  if (clientsError) throw new Error(`Falha ao carregar clientes para o assistente de campanha: ${clientsError.message}`);

  type Row = {
    id: string;
    name: string;
    trade_name: string | null;
    status: string;
    daily_budget: number | null;
    average_ticket: number | null;
    brand_policy: string;
    client_segments: { segment_id: string }[];
    client_equipment: { equipment: { id: string; name: string; segment_id: string } | null }[];
    client_services: { id: string; equipment: { id: string; name: string } | null; service: { id: string; name: string } | null }[];
    client_locations: { id: string; city: string; state: string; priority: string | null; is_served: boolean }[];
    client_conversions: { id: string; name: string; conversion_type: string; is_primary: boolean; status: string }[];
    client_landing_pages: { id: string; name: string; url: string; equipment_id: string | null; service_id: string | null; city: string | null; status: string }[];
    client_excluded_equipment: { label: string | null; equipment_id: string | null; equipment: { name: string } | null }[];
    client_excluded_services: { label: string | null; equipment_id: string | null; service_id: string | null; equipment: { name: string } | null; service: { name: string } | null }[];
    client_brands: { status: string; brand: { name: string } | null }[];
  };

  return (clients as unknown as Row[]).map((c) => {
    const excludedEquipmentIds = new Set(c.client_excluded_equipment.map((e) => e.equipment_id).filter((id): id is string => Boolean(id)));
    // A service exclusion with equipment_id set but service_id null bans the WHOLE equipment for services; equipment_id+service_id bans that one combo.
    const excludedServiceCombos = c.client_excluded_services.filter((s) => s.equipment_id);

    return {
      id: c.id,
      name: c.name,
      displayName: c.trade_name || c.name,
      status: c.status,
      dailyBudget: c.daily_budget,
      averageTicket: c.average_ticket,
      brandPolicy: c.brand_policy,
      segmentIds: c.client_segments.map((s) => s.segment_id),
      equipment: c.client_equipment
        .filter((e) => e.equipment && !excludedEquipmentIds.has(e.equipment!.id))
        .map((e) => ({ id: e.equipment!.id, name: e.equipment!.name, segmentId: e.equipment!.segment_id })),
      serviceOfferings: c.client_services
        .filter((s) => s.equipment && s.service)
        .filter(
          (s) =>
            !excludedEquipmentIds.has(s.equipment!.id) &&
            !excludedServiceCombos.some((ex) => ex.equipment_id === s.equipment!.id && (ex.service_id === null || ex.service_id === s.service!.id))
        )
        .map((s) => ({
          id: s.id,
          equipmentId: s.equipment!.id,
          equipmentName: s.equipment!.name,
          serviceId: s.service!.id,
          serviceName: s.service!.name,
        })),
      locations: c.client_locations.map((l) => ({ id: l.id, city: l.city, state: l.state, priority: l.priority, isServed: l.is_served })),
      conversions: c.client_conversions
        .filter((cv) => cv.status === "active")
        .map((cv) => ({ id: cv.id, name: cv.name, conversionType: cv.conversion_type, isPrimary: cv.is_primary })),
      landingPages: c.client_landing_pages
        .filter((lp) => lp.status === "active")
        .map((lp) => ({ id: lp.id, name: lp.name, url: lp.url, equipmentId: lp.equipment_id, serviceId: lp.service_id, city: lp.city })),
      excludedEquipmentLabels: c.client_excluded_equipment.map((e) => e.equipment?.name ?? e.label ?? "").filter(Boolean),
      excludedServiceLabels: c.client_excluded_services
        .map((s) => s.label ?? [s.equipment?.name, s.service?.name].filter(Boolean).join(" / "))
        .filter(Boolean),
      excludedBrandNames: c.client_brands.filter((b) => b.status === "not_served" && b.brand).map((b) => b.brand!.name),
    };
  });
}

// ============================================================
// Creation + generation
// ============================================================

export interface CreateCampaignInput {
  clientId: string;
  name: string;
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

async function insertBriefingJoins(supabase: SupabaseClient, campaignId: string, input: CreateCampaignInput): Promise<void> {
  const inserts: PromiseLike<{ error: { message: string } | null }>[] = [];
  if (input.equipmentIds.length > 0) {
    inserts.push(supabase.from("campaign_equipment").insert(input.equipmentIds.map((equipment_id) => ({ campaign_id: campaignId, equipment_id }))));
  }
  if (input.clientServiceIds.length > 0) {
    inserts.push(
      supabase.from("campaign_services").insert(input.clientServiceIds.map((client_service_id) => ({ campaign_id: campaignId, client_service_id })))
    );
  }
  if (input.clientLocationIds.length > 0) {
    inserts.push(
      supabase
        .from("campaign_locations")
        .insert(input.clientLocationIds.map((client_location_id) => ({ campaign_id: campaignId, client_location_id })))
    );
  }
  if (input.conversionIds.length > 0) {
    inserts.push(
      supabase
        .from("campaign_conversions")
        .insert(input.conversionIds.map((client_conversion_id) => ({ campaign_id: campaignId, client_conversion_id })))
    );
  }
  if (input.landingPageIds.length > 0) {
    inserts.push(
      supabase
        .from("campaign_landing_pages")
        .insert(input.landingPageIds.map((client_landing_page_id) => ({ campaign_id: campaignId, client_landing_page_id })))
    );
  }

  const results = await Promise.all(inserts);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`Falha ao salvar briefing da campanha: ${failed.error.message}`);
}

/** Cria a campanha (status 'draft') + briefing imutável. Não gera estratégia ainda. */
export async function createCampaignDraft(supabase: SupabaseClient, input: CreateCampaignInput, organizationId: string, userId: string): Promise<string> {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      created_by: userId,
      name: input.name,
      segment_id: input.segmentId,
      objective: input.objective,
      daily_budget: input.dailyBudget,
      notes: input.notes,
      status: "draft",
    })
    .select("id")
    .single();
  if (campaignError) throw new Error(`Falha ao criar campanha: ${campaignError.message}`);

  const campaignId = campaign.id as string;
  await insertBriefingJoins(supabase, campaignId, input);
  return campaignId;
}

async function loadBriefingSelection(supabase: SupabaseClient, campaignId: string): Promise<Omit<CampaignContextSelection, "campaignId" | "clientId" | "segmentId" | "dailyBudget" | "objective" | "notes">> {
  const [{ data: eq, error: eqErr }, { data: sv, error: svErr }, { data: loc, error: locErr }, { data: conv, error: convErr }, { data: lp, error: lpErr }] =
    await Promise.all([
      supabase.from("campaign_equipment").select("equipment_id").eq("campaign_id", campaignId),
      supabase.from("campaign_services").select("client_service_id").eq("campaign_id", campaignId),
      supabase.from("campaign_locations").select("client_location_id").eq("campaign_id", campaignId),
      supabase.from("campaign_conversions").select("client_conversion_id").eq("campaign_id", campaignId),
      supabase.from("campaign_landing_pages").select("client_landing_page_id").eq("campaign_id", campaignId),
    ]);
  if (eqErr) throw new Error(`Falha ao carregar equipamentos da campanha: ${eqErr.message}`);
  if (svErr) throw new Error(`Falha ao carregar serviços da campanha: ${svErr.message}`);
  if (locErr) throw new Error(`Falha ao carregar regiões da campanha: ${locErr.message}`);
  if (convErr) throw new Error(`Falha ao carregar conversões da campanha: ${convErr.message}`);
  if (lpErr) throw new Error(`Falha ao carregar landing pages da campanha: ${lpErr.message}`);

  return {
    equipmentIds: (eq as { equipment_id: string }[]).map((r) => r.equipment_id),
    clientServiceIds: (sv as { client_service_id: string }[]).map((r) => r.client_service_id),
    clientLocationIds: (loc as { client_location_id: string }[]).map((r) => r.client_location_id),
    conversionIds: (conv as { client_conversion_id: string }[]).map((r) => r.client_conversion_id),
    landingPageIds: (lp as { client_landing_page_id: string }[]).map((r) => r.client_landing_page_id),
  };
}

async function persistStrategyVersion(
  supabase: SupabaseClient,
  campaignId: string,
  versionNumber: number,
  strategy: CampaignStrategy,
  generatorType: "ai" | "deterministic",
  generatedBy: string,
  generationReason: string | null,
  userId: string
): Promise<void> {
  const { data: version, error: versionError } = await supabase
    .from("campaign_versions")
    .insert({
      campaign_id: campaignId,
      version_number: versionNumber,
      strategy_json: strategy,
      generator_type: generatorType,
      generated_by: generatedBy,
      generation_reason: generationReason,
      created_by: userId,
    })
    .select("id")
    .single();
  if (versionError) throw new Error(`Falha ao salvar estratégia: ${versionError.message}`);
  const versionId = version.id as string;

  for (const group of strategy.ad_groups) {
    const { data: adGroup, error: adGroupError } = await supabase
      .from("campaign_ad_groups")
      .insert({
        campaign_version_id: versionId,
        name: group.name,
        theme: group.theme,
      })
      .select("id")
      .single();
    if (adGroupError) throw new Error(`Falha ao salvar grupo de anúncio: ${adGroupError.message}`);

    if (group.keywords.length > 0) {
      const { error: keywordsError } = await supabase.from("campaign_keywords").insert(
        group.keywords.map((k) => ({ ad_group_id: adGroup.id, text: k.text, match_type: k.match_type, intent: k.intent, reason: k.reason }))
      );
      if (keywordsError) throw new Error(`Falha ao salvar palavras-chave: ${keywordsError.message}`);
    }

    if (group.ads.length > 0) {
      const { error: adsError } = await supabase.from("campaign_ads").insert(
        group.ads.map((a) => ({ ad_group_id: adGroup.id, headlines: a.headlines, descriptions: a.descriptions, path1: a.path1 ?? null, path2: a.path2 ?? null }))
      );
      if (adsError) throw new Error(`Falha ao salvar anúncios: ${adsError.message}`);
    }
  }

  if (strategy.campaign_negatives.length > 0) {
    const { error: negativesError } = await supabase.from("campaign_negatives").insert(
      strategy.campaign_negatives.map((n) => ({
        campaign_version_id: versionId,
        text: n.text,
        match_type: n.match_type,
        category: n.category,
        reason: n.reason,
      }))
    );
    if (negativesError) throw new Error(`Falha ao salvar palavras negativas: ${negativesError.message}`);
  }

  const assetRows = [
    ...strategy.assets.sitelinks.map((content) => ({ campaign_version_id: versionId, asset_type: "sitelink" as const, content })),
    ...strategy.assets.callouts.map((content) => ({ campaign_version_id: versionId, asset_type: "callout" as const, content })),
    ...strategy.assets.structured_snippets.map((content) => ({ campaign_version_id: versionId, asset_type: "structured_snippet" as const, content })),
  ];
  if (assetRows.length > 0) {
    const { error: assetsError } = await supabase.from("campaign_assets").insert(assetRows);
    if (assetsError) throw new Error(`Falha ao salvar ativos: ${assetsError.message}`);
  }
}

export interface GenerationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** ContextBuilder → DeterministicValidation → AIProvider → schema.parse() → (1 correção) → persistência. */
export async function generateStrategyForCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
  generationReason: string | null = null
): Promise<GenerationResult> {
  const campaign = await getCampaign(supabase, campaignId);
  if (!campaign) return { ok: false, errors: ["Campanha não encontrada."], warnings: [] };

  const selection = await loadBriefingSelection(supabase, campaignId);
  const context = await buildCampaignContext(supabase, {
    campaignId,
    clientId: campaign.clientId,
    segmentId: campaign.segmentId,
    dailyBudget: campaign.dailyBudget,
    objective: campaign.objective,
    notes: campaign.notes,
    ...selection,
  });

  const { errors: contextErrors, warnings } = validateCampaignContext(context);
  if (contextErrors.length > 0) {
    return { ok: false, errors: contextErrors, warnings };
  }

  const provider = await getConfiguredAIProvider();
  const generatorType: "ai" | "deterministic" = provider.name === "deterministic" ? "deterministic" : "ai";

  let raw: unknown;
  try {
    raw = await provider.generateStrategy(context);
  } catch (err) {
    return { ok: false, errors: [err instanceof Error ? err.message : "Falha ao chamar o provedor de IA."], warnings };
  }

  let parsed = campaignStrategySchema.safeParse(raw);
  let hallucinationErrors = parsed.success ? validateGeneratedStrategy(parsed.data, context) : [];

  if (!parsed.success || hallucinationErrors.length > 0) {
    const issues = parsed.success
      ? hallucinationErrors
      : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

    try {
      raw = await provider.generateStrategy(context, { previousOutput: raw, issues });
    } catch (err) {
      return { ok: false, errors: [err instanceof Error ? err.message : "Falha ao chamar o provedor de IA na correção."], warnings };
    }
    parsed = campaignStrategySchema.safeParse(raw);
    hallucinationErrors = parsed.success ? validateGeneratedStrategy(parsed.data, context) : [];

    if (!parsed.success || hallucinationErrors.length > 0) {
      const finalIssues = parsed.success ? hallucinationErrors : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return {
        ok: false,
        errors: ["A estratégia gerada não passou na validação mesmo após uma correção. Nada foi salvo.", ...finalIssues],
        warnings,
      };
    }
  }

  const strategy = parsed.data;
  const existingVersions = await listCampaignVersions(supabase, campaignId);
  const nextVersionNumber = (existingVersions[0]?.versionNumber ?? 0) + 1;

  await persistStrategyVersion(supabase, campaignId, nextVersionNumber, strategy, generatorType, provider.name, generationReason, userId);

  const { error: statusError } = await supabase.from("campaigns").update({ status: "strategy_generated" }).eq("id", campaignId);
  if (statusError) throw new Error(`Falha ao atualizar status: ${statusError.message}`);

  return { ok: true, errors: [], warnings: [...warnings, ...strategy.warnings] };
}
