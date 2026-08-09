export type Role = "admin" | "atendente" | "cliente";

export interface Profile {
  id: string;
  role: Role;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  businessHours: BusinessHoursEntry[];
  updatedAt: string;
}

export interface BusinessHoursEntry {
  weekday: number;
  open: string | null;
  close: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalWorkingHours {
  id: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ProfessionalTimeOff {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export type AppointmentStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  content: string;
  rating: number | null;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
