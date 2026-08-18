export type OrgRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export type ClientStatus = "onboarding" | "active" | "paused" | "churned";
export type BrandPolicy = "no_restriction" | "specific";

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  website: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  businessHours: string | null;
  notes: string | null;
  status: ClientStatus;
  primaryCity: string | null;
  primaryState: string | null;
  dailyBudget: number | null;
  monthlyBudgetEstimate: number | null;
  averageTicket: number | null;
  leadGoal: number | null;
  cplGoal: number | null;
  closedServicesGoal: number | null;
  cpaGoal: number | null;
  roasGoal: number | null;
  brandPolicy: BrandPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListItem {
  id: string;
  name: string;
  tradeName: string | null;
  status: ClientStatus;
  primaryCity: string | null;
  dailyBudget: number | null;
  segments: string[];
  lastActivityAt: string | null;
}

export interface Segment {
  id: string;
  key: string;
  label: string;
}

export interface Equipment {
  id: string;
  organizationId: string | null;
  segmentId: string;
  name: string;
}

export interface ServiceType {
  id: string;
  organizationId: string | null;
  name: string;
}

export interface Brand {
  id: string;
  organizationId: string | null;
  name: string;
}

export interface ClientExcludedEquipment {
  id: string;
  clientId: string;
  equipmentId: string | null;
  equipmentName: string | null;
  label: string | null;
  notes: string | null;
}

export interface ClientServiceOffering {
  id: string;
  clientId: string;
  equipmentId: string;
  equipmentName: string;
  serviceId: string;
  serviceName: string;
  notes: string | null;
}

export interface ClientExcludedService {
  id: string;
  clientId: string;
  equipmentId: string | null;
  equipmentName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  label: string | null;
  notes: string | null;
}

export type BrandStatus = "served" | "not_served";

export interface ClientBrandStatus {
  id: string;
  clientId: string;
  brandId: string;
  brandName: string;
  status: BrandStatus;
}

export type LocationPriority = "muito_alta" | "alta" | "media" | "baixa";

export interface ClientLocation {
  id: string;
  clientId: string;
  city: string;
  state: string;
  neighborhood: string | null;
  priority: LocationPriority | null;
  isServed: boolean;
}

export type LandingPageStatus = "active" | "inactive";

export interface ClientLandingPage {
  id: string;
  clientId: string;
  name: string;
  url: string;
  segmentId: string | null;
  equipmentId: string | null;
  serviceId: string | null;
  city: string | null;
  status: LandingPageStatus;
}

export type ConversionType = "whatsapp" | "call" | "form" | "booking" | "purchase" | "other";

export interface ClientConversion {
  id: string;
  clientId: string;
  name: string;
  platform: string | null;
  conversionType: ConversionType;
  externalId: string | null;
  status: LandingPageStatus;
  isPrimary: boolean;
  notes: string | null;
}

export type CampaignObjective = "leads" | "whatsapp" | "calls" | "forms" | "bookings";

export type CampaignStatus =
  | "draft"
  | "strategy_generated"
  | "under_audit"
  | "rejected"
  | "approved"
  | "awaiting_human_approval"
  | "approved_for_execution"
  | "executed"
  | "qa_review"
  | "active"
  | "optimization";

export interface Campaign {
  id: string;
  organizationId: string;
  clientId: string;
  createdBy: string | null;
  name: string;
  segmentId: string;
  objective: CampaignObjective;
  dailyBudget: number;
  notes: string | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListItem {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  segmentLabel: string;
  objective: CampaignObjective;
  dailyBudget: number;
  status: CampaignStatus;
  createdAt: string;
}

export type GeneratorType = "ai" | "deterministic";

export interface CampaignVersion {
  id: string;
  campaignId: string;
  versionNumber: number;
  strategy: import("@/lib/schemas/campaign-strategy").CampaignStrategy;
  generatorType: GeneratorType;
  /** Model identifier (or "deterministic" for the rule-based engine). */
  generatedBy: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  generationReason: string | null;
  createdAt: string;
}

/** UI-facing shape of a campaign_ad_groups row, joined with its ads/keywords for display. */
export interface CampaignAdGroupRow {
  id: string;
  name: string;
  theme: string | null;
  landingPageUrl: string | null;
  keywords: { text: string; matchType: "exact" | "phrase"; intent: string | null; reason: string | null }[];
  ads: { headlines: string[]; descriptions: string[]; path1: string | null; path2: string | null }[];
}

export interface CampaignNegativeRow {
  text: string;
  matchType: "exact" | "phrase" | "broad";
  category: string;
  reason: string | null;
}

export interface CampaignAssetsRow {
  sitelinks: string[];
  callouts: string[];
  structuredSnippets: string[];
}

export interface CampaignAudit {
  id: string;
  organizationId: string;
  clientId: string;
  campaignId: string;
  campaignVersionId: string;
  auditorProvider: GeneratorType;
  auditorModel: string;
  promptVersion: string;
  score: number;
  status: import("@/lib/schemas/campaign-audit").AuditStatus;
  report: import("@/lib/schemas/campaign-audit").AuditReport;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CampaignApproval {
  id: string;
  campaignId: string;
  campaignVersionId: string;
  campaignAuditId: string;
  approvedBy: string | null;
  approvedAt: string;
  notes: string | null;
}

export interface ActivityLogEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  userName: string | null;
  clientId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}
