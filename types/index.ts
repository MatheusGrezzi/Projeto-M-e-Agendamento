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
