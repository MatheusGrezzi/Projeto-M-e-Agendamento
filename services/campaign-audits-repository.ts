import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { runCampaignAudit } from "@/lib/agents/campaign-audit";
import { buildCampaignContext } from "@/lib/agents/campaign-context";
import { evaluateApprovalGate } from "@/lib/agents/campaign-approval-rules";
import { hasCriticalIssue } from "@/lib/schemas/campaign-audit";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";
import { campaignApprovalFromRow, campaignAuditFromRow, type CampaignApprovalRow, type CampaignAuditRow } from "@/lib/mappers";
import type { CampaignApproval, CampaignAudit } from "@/types";
import { getCampaign } from "./campaigns-repository";
import { getClient } from "./clients-repository";

async function loadBriefingSelectionForContext(supabase: SupabaseClient, campaignId: string) {
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

export async function listCampaignAudits(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignAudit[]> {
  const { data, error } = await supabase
    .from("campaign_audits")
    .select("*")
    .eq("campaign_version_id", campaignVersionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar auditorias: ${error.message}`);
  return (data as CampaignAuditRow[]).map(campaignAuditFromRow);
}

export async function getLatestCampaignAudit(supabase: SupabaseClient, campaignVersionId: string): Promise<CampaignAudit | null> {
  const audits = await listCampaignAudits(supabase, campaignVersionId);
  return audits[0] ?? null;
}

export interface RunAuditResult {
  audit: CampaignAudit;
}

/** CampaignStrategy → DeterministicAudit → (Claude Auditor) → AuditSchema → PostValidation → campaign_audits. Always creates a new row — never reuses a prior audit, even for the same version. */
export async function auditCampaignVersion(
  supabase: SupabaseClient,
  campaignId: string,
  campaignVersionId: string,
  strategy: CampaignStrategy,
  userId: string
): Promise<RunAuditResult> {
  const campaign = await getCampaign(supabase, campaignId);
  if (!campaign) throw new Error("Campanha não encontrada.");

  const client = await getClient(supabase, campaign.clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  const selection = await loadBriefingSelectionForContext(supabase, campaignId);
  const context = await buildCampaignContext(supabase, {
    campaignId,
    clientId: campaign.clientId,
    segmentId: campaign.segmentId,
    dailyBudget: campaign.dailyBudget,
    objective: campaign.objective,
    notes: campaign.notes,
    ...selection,
  });

  const { report, auditorProvider, auditorModel, promptVersion, inputTokens, outputTokens, durationMs } = await runCampaignAudit(context, strategy);

  const { data, error } = await supabase
    .from("campaign_audits")
    .insert({
      organization_id: campaign.organizationId,
      client_id: campaign.clientId,
      campaign_id: campaignId,
      campaign_version_id: campaignVersionId,
      auditor_provider: auditorProvider,
      auditor_model: auditorModel,
      prompt_version: promptVersion,
      score: report.score,
      status: report.status,
      report_json: report,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      duration_ms: durationMs,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Falha ao salvar auditoria: ${error.message}`);

  const audit = campaignAuditFromRow(data as CampaignAuditRow);

  const nextStatus = hasCriticalIssue(report.issues) || report.status === "rejected" ? "rejected" : "awaiting_human_approval";
  const { error: statusError } = await supabase.from("campaigns").update({ status: nextStatus }).eq("id", campaignId);
  if (statusError) throw new Error(`Falha ao atualizar status da campanha: ${statusError.message}`);

  return { audit };
}

export async function listCampaignApprovals(supabase: SupabaseClient, campaignId: string): Promise<CampaignApproval[]> {
  const { data, error } = await supabase
    .from("campaign_approvals")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("approved_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar aprovações: ${error.message}`);
  return (data as CampaignApprovalRow[]).map(campaignApprovalFromRow);
}

export interface ApproveCampaignInput {
  campaignId: string;
  campaignVersionId: string;
  campaignAuditId: string;
  notes: string | null;
}

/**
 * Apenas permite aprovação humana se: a auditoria referenciada é da versão
 * ATUAL da campanha, não tem issue critical, e seu status não é 'rejected'.
 * Reprova qualquer tentativa de aprovar contra uma versão/auditoria velha.
 */
export async function approveCampaign(supabase: SupabaseClient, input: ApproveCampaignInput, userId: string): Promise<void> {
  const campaign = await getCampaign(supabase, input.campaignId);
  if (!campaign) throw new Error("Campanha não encontrada.");

  const { data: latestVersion, error: versionError } = await supabase
    .from("campaign_versions")
    .select("id, version_number")
    .eq("campaign_id", input.campaignId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) throw new Error(`Falha ao carregar versão atual: ${versionError.message}`);

  const audit = await getLatestCampaignAudit(supabase, input.campaignVersionId);

  const gate = evaluateApprovalGate({
    latestVersionId: (latestVersion as { id: string } | null)?.id ?? "",
    targetVersionId: input.campaignVersionId,
    latestAuditIdForTargetVersion: audit?.id ?? null,
    targetAuditId: input.campaignAuditId,
    auditStatus: audit?.status ?? "rejected",
    auditIssues: audit?.report.issues ?? [],
  });
  if (!gate.allowed) throw new Error(gate.reason ?? "Aprovação não permitida.");

  const { error: insertError } = await supabase.from("campaign_approvals").insert({
    campaign_id: input.campaignId,
    campaign_version_id: input.campaignVersionId,
    campaign_audit_id: input.campaignAuditId,
    approved_by: userId,
    notes: input.notes,
  });
  if (insertError) throw new Error(`Falha ao registrar aprovação: ${insertError.message}`);

  const { error: statusError } = await supabase.from("campaigns").update({ status: "approved_for_execution" }).eq("id", input.campaignId);
  if (statusError) throw new Error(`Falha ao atualizar status: ${statusError.message}`);
}
