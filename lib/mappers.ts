import type {
  Appointment,
  AppointmentStatus,
  BusinessHoursEntry,
  CompanySettings,
  Professional,
  ProfessionalTimeOff,
  ProfessionalWorkingHours,
  Profile,
  Role,
  Service,
  Testimonial,
} from "@/types";

export interface ProfileRow {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role as Role,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CompanySettingsRow {
  id: string;
  business_hours: BusinessHoursEntry[];
  updated_at: string;
}

export function companySettingsFromRow(row: CompanySettingsRow): CompanySettings {
  return {
    id: row.id,
    businessHours: row.business_hours,
    updatedAt: row.updated_at,
  };
}

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function serviceFromRow(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    active: row.active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ProfessionalRow {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function professionalFromRow(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    fullName: row.full_name,
    bio: row.bio,
    photoUrl: row.photo_url,
    active: row.active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ProfessionalWorkingHoursRow {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export function workingHoursFromRow(row: ProfessionalWorkingHoursRow): ProfessionalWorkingHours {
  return {
    id: row.id,
    professionalId: row.professional_id,
    weekday: row.weekday,
    // Postgres `time` columns come back as "HH:MM:SS" — trim to "HH:MM" to match the app's wire format.
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

export interface ProfessionalTimeOffRow {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export function timeOffFromRow(row: ProfessionalTimeOffRow): ProfessionalTimeOff {
  return {
    id: row.id,
    professionalId: row.professional_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  };
}

export interface AppointmentRow {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function appointmentFromRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,
    professionalId: row.professional_id,
    serviceId: row.service_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status as AppointmentStatus,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface TestimonialRow {
  id: string;
  client_name: string;
  content: string;
  rating: number | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function testimonialFromRow(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    clientName: row.client_name,
    content: row.content,
    rating: row.rating,
    featured: row.featured,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
