import type {
  ActivityLogEntry,
  Brand,
  Campaign,
  CampaignListItem,
  CampaignVersion,
  Client,
  ClientBrandStatus,
  ClientConversion,
  ClientExcludedEquipment,
  ClientExcludedService,
  ClientLandingPage,
  ClientListItem,
  ClientLocation,
  ClientServiceOffering,
  Equipment,
  Profile,
  Segment,
  ServiceType,
} from "@/types";
import type { CampaignStrategy } from "@/lib/schemas/campaign-strategy";
import type { AuditReport } from "@/lib/schemas/campaign-audit";
import type { CampaignApproval, CampaignAudit } from "@/types";

export interface ClientRow {
  id: string;
  organization_id: string;
  name: string;
  trade_name: string | null;
  cnpj: string | null;
  website: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  business_hours: string | null;
  notes: string | null;
  status: Client["status"];
  primary_city: string | null;
  primary_state: string | null;
  daily_budget: number | null;
  monthly_budget_estimate: number | null;
  average_ticket: number | null;
  lead_goal: number | null;
  cpl_goal: number | null;
  closed_services_goal: number | null;
  cpa_goal: number | null;
  roas_goal: number | null;
  brand_policy: Client["brandPolicy"];
  created_at: string;
  updated_at: string;
}

export function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    tradeName: row.trade_name,
    cnpj: row.cnpj,
    website: row.website,
    whatsapp: row.whatsapp,
    phone: row.phone,
    email: row.email,
    businessHours: row.business_hours,
    notes: row.notes,
    status: row.status,
    primaryCity: row.primary_city,
    primaryState: row.primary_state,
    dailyBudget: row.daily_budget,
    monthlyBudgetEstimate: row.monthly_budget_estimate,
    averageTicket: row.average_ticket,
    leadGoal: row.lead_goal,
    cplGoal: row.cpl_goal,
    closedServicesGoal: row.closed_services_goal,
    cpaGoal: row.cpa_goal,
    roasGoal: row.roas_goal,
    brandPolicy: row.brand_policy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function clientListItemFromRow(
  row: Pick<ClientRow, "id" | "name" | "trade_name" | "status" | "primary_city" | "daily_budget">,
  segments: string[],
  lastActivityAt: string | null
): ClientListItem {
  return {
    id: row.id,
    name: row.name,
    tradeName: row.trade_name,
    status: row.status,
    primaryCity: row.primary_city,
    dailyBudget: row.daily_budget,
    segments,
    lastActivityAt,
  };
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function profileFromRow(row: ProfileRow): Profile {
  return { id: row.id, fullName: row.full_name, email: row.email, avatarUrl: row.avatar_url };
}

export interface SegmentRow {
  id: string;
  key: string;
  label: string;
}

export function segmentFromRow(row: SegmentRow): Segment {
  return { id: row.id, key: row.key, label: row.label };
}

export interface EquipmentRow {
  id: string;
  organization_id: string | null;
  segment_id: string;
  name: string;
}

export function equipmentFromRow(row: EquipmentRow): Equipment {
  return { id: row.id, organizationId: row.organization_id, segmentId: row.segment_id, name: row.name };
}

export interface ServiceTypeRow {
  id: string;
  organization_id: string | null;
  name: string;
}

export function serviceTypeFromRow(row: ServiceTypeRow): ServiceType {
  return { id: row.id, organizationId: row.organization_id, name: row.name };
}

export interface BrandRow {
  id: string;
  organization_id: string | null;
  name: string;
}

export function brandFromRow(row: BrandRow): Brand {
  return { id: row.id, organizationId: row.organization_id, name: row.name };
}

export interface ClientExcludedEquipmentRow {
  id: string;
  client_id: string;
  equipment_id: string | null;
  label: string | null;
  notes: string | null;
  equipment: { name: string } | null;
}

export function clientExcludedEquipmentFromRow(row: ClientExcludedEquipmentRow): ClientExcludedEquipment {
  return {
    id: row.id,
    clientId: row.client_id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment?.name ?? null,
    label: row.label,
    notes: row.notes,
  };
}

export interface ClientServiceOfferingRow {
  id: string;
  client_id: string;
  equipment_id: string;
  service_id: string;
  notes: string | null;
  equipment: { name: string } | null;
  service: { name: string } | null;
}

export function clientServiceOfferingFromRow(row: ClientServiceOfferingRow): ClientServiceOffering {
  return {
    id: row.id,
    clientId: row.client_id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment?.name ?? "",
    serviceId: row.service_id,
    serviceName: row.service?.name ?? "",
    notes: row.notes,
  };
}

export interface ClientExcludedServiceRow {
  id: string;
  client_id: string;
  equipment_id: string | null;
  service_id: string | null;
  label: string | null;
  notes: string | null;
  equipment: { name: string } | null;
  service: { name: string } | null;
}

export function clientExcludedServiceFromRow(row: ClientExcludedServiceRow): ClientExcludedService {
  return {
    id: row.id,
    clientId: row.client_id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment?.name ?? null,
    serviceId: row.service_id,
    serviceName: row.service?.name ?? null,
    label: row.label,
    notes: row.notes,
  };
}

export interface ClientBrandStatusRow {
  id: string;
  client_id: string;
  brand_id: string;
  status: ClientBrandStatus["status"];
  brand: { name: string } | null;
}

export function clientBrandStatusFromRow(row: ClientBrandStatusRow): ClientBrandStatus {
  return {
    id: row.id,
    clientId: row.client_id,
    brandId: row.brand_id,
    brandName: row.brand?.name ?? "",
    status: row.status,
  };
}

export interface ClientLocationRow {
  id: string;
  client_id: string;
  city: string;
  state: string;
  neighborhood: string | null;
  priority: ClientLocation["priority"];
  is_served: boolean;
}

export function clientLocationFromRow(row: ClientLocationRow): ClientLocation {
  return {
    id: row.id,
    clientId: row.client_id,
    city: row.city,
    state: row.state,
    neighborhood: row.neighborhood,
    priority: row.priority,
    isServed: row.is_served,
  };
}

export interface ClientLandingPageRow {
  id: string;
  client_id: string;
  name: string;
  url: string;
  segment_id: string | null;
  equipment_id: string | null;
  service_id: string | null;
  city: string | null;
  status: ClientLandingPage["status"];
}

export function clientLandingPageFromRow(row: ClientLandingPageRow): ClientLandingPage {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    url: row.url,
    segmentId: row.segment_id,
    equipmentId: row.equipment_id,
    serviceId: row.service_id,
    city: row.city,
    status: row.status,
  };
}

export interface ClientConversionRow {
  id: string;
  client_id: string;
  name: string;
  platform: string | null;
  conversion_type: ClientConversion["conversionType"];
  external_id: string | null;
  status: ClientConversion["status"];
  is_primary: boolean;
  notes: string | null;
}

export function clientConversionFromRow(row: ClientConversionRow): ClientConversion {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    platform: row.platform,
    conversionType: row.conversion_type,
    externalId: row.external_id,
    status: row.status,
    isPrimary: row.is_primary,
    notes: row.notes,
  };
}

export interface CampaignRow {
  id: string;
  organization_id: string;
  client_id: string;
  created_by: string | null;
  name: string;
  segment_id: string;
  objective: Campaign["objective"];
  daily_budget: number;
  notes: string | null;
  status: Campaign["status"];
  created_at: string;
  updated_at: string;
}

export function campaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    createdBy: row.created_by,
    name: row.name,
    segmentId: row.segment_id,
    objective: row.objective,
    dailyBudget: row.daily_budget,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CampaignListItemRow {
  id: string;
  name: string;
  objective: Campaign["objective"];
  daily_budget: number;
  status: Campaign["status"];
  created_at: string;
  client: { id: string; name: string; trade_name: string | null } | null;
  segment: { label: string } | null;
}

export function campaignListItemFromRow(row: CampaignListItemRow): CampaignListItem {
  return {
    id: row.id,
    clientId: row.client?.id ?? "",
    clientName: row.client ? row.client.trade_name || row.client.name : "",
    name: row.name,
    segmentLabel: row.segment?.label ?? "",
    objective: row.objective,
    dailyBudget: row.daily_budget,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface CampaignVersionRow {
  id: string;
  campaign_id: string;
  version_number: number;
  strategy_json: CampaignStrategy;
  generator_type: CampaignVersion["generatorType"];
  generated_by: string;
  prompt_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  generation_reason: string | null;
  created_at: string;
}

export function campaignVersionFromRow(row: CampaignVersionRow): CampaignVersion {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    versionNumber: row.version_number,
    strategy: row.strategy_json,
    generatorType: row.generator_type,
    generatedBy: row.generated_by,
    promptVersion: row.prompt_version,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    durationMs: row.duration_ms,
    generationReason: row.generation_reason,
    createdAt: row.created_at,
  };
}

export interface CampaignAuditRow {
  id: string;
  organization_id: string;
  client_id: string;
  campaign_id: string;
  campaign_version_id: string;
  auditor_provider: CampaignAudit["auditorProvider"];
  auditor_model: string;
  prompt_version: string;
  score: number;
  status: CampaignAudit["status"];
  report_json: AuditReport;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  created_by: string | null;
  created_at: string;
}

export function campaignAuditFromRow(row: CampaignAuditRow): CampaignAudit {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    campaignId: row.campaign_id,
    campaignVersionId: row.campaign_version_id,
    auditorProvider: row.auditor_provider,
    auditorModel: row.auditor_model,
    promptVersion: row.prompt_version,
    score: row.score,
    status: row.status,
    report: row.report_json,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    durationMs: row.duration_ms,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export interface CampaignApprovalRow {
  id: string;
  campaign_id: string;
  campaign_version_id: string;
  campaign_audit_id: string;
  approved_by: string | null;
  approved_at: string;
  notes: string | null;
}

export function campaignApprovalFromRow(row: CampaignApprovalRow): CampaignApproval {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignVersionId: row.campaign_version_id,
    campaignAuditId: row.campaign_audit_id,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    notes: row.notes,
  };
}

export interface ActivityLogRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  client_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user: { full_name: string | null } | null;
}

export function activityLogFromRow(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    userName: row.user?.full_name ?? null,
    clientId: row.client_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}
