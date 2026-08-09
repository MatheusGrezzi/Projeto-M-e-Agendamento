import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { appointmentFromRow, type AppointmentRow } from "@/lib/mappers";
import { timeStringToMinutes, wallTimeToUtcDate } from "@/lib/booking/timezone";
import { companyConfig } from "@/lib/config/company-config";
import type { Appointment } from "@/types";

import { getAvailableSlots } from "./availability-repository";

export async function createAppointment(
  supabase: SupabaseClient,
  params: {
    professionalId: string;
    serviceId: string;
    date: string;
    startTime: string;
    clientId: string;
    createdBy: string;
    notes?: string;
  }
): Promise<Appointment> {
  // Re-check availability immediately before insert — the race-condition
  // guard against a slot picked client-side minutes ago having since been
  // taken. Reuses the exact same slot computation the public/staff booking
  // UIs used to offer this slot in the first place.
  const available = await getAvailableSlots(supabase, {
    professionalId: params.professionalId,
    serviceId: params.serviceId,
    date: params.date,
  });
  if (!available.some((slot) => slot.startTime === params.startTime)) {
    throw new Error("Esse horário não está mais disponível. Escolha outro horário.");
  }

  const { data: serviceRow, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", params.serviceId)
    .single();
  if (serviceError) throw new Error(`Falha ao carregar serviço: ${serviceError.message}`);

  const startMinutes = timeStringToMinutes(params.startTime);
  const startsAt = wallTimeToUtcDate(params.date, startMinutes, companyConfig.timezone);
  const endsAt = wallTimeToUtcDate(params.date, startMinutes + serviceRow.duration_minutes, companyConfig.timezone);

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      client_id: params.clientId,
      professional_id: params.professionalId,
      service_id: params.serviceId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: params.notes || null,
      created_by: params.createdBy,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar agendamento: ${error.message}`);
  return appointmentFromRow(data as AppointmentRow);
}

export async function listAppointmentsForClient(supabase: SupabaseClient, clientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar agendamentos: ${error.message}`);
  return (data as AppointmentRow[]).map(appointmentFromRow);
}

export interface AppointmentWithDetails extends Appointment {
  serviceName: string;
  professionalName: string;
}

/** Same as listAppointmentsForClient, but joins in the service/professional names for display — avoids N+1 lookups in the "meus agendamentos" list. */
export async function listAppointmentsForClientWithDetails(supabase: SupabaseClient, clientId: string): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, services(name), professionals(full_name)")
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar agendamentos: ${error.message}`);
  return (data as unknown as (AppointmentRow & { services: { name: string } | null; professionals: { full_name: string } | null })[]).map(
    (row) => ({
      ...appointmentFromRow(row),
      serviceName: row.services?.name ?? "Serviço removido",
      professionalName: row.professionals?.full_name ?? "Profissional removido",
    })
  );
}

export async function listAppointmentsForStaff(supabase: SupabaseClient, options: { date?: string } = {}): Promise<Appointment[]> {
  let query = supabase.from("appointments").select("*").order("starts_at", { ascending: true });

  if (options.date) {
    const dayStart = wallTimeToUtcDate(options.date, 0, companyConfig.timezone);
    const dayEnd = wallTimeToUtcDate(options.date, 24 * 60, companyConfig.timezone);
    query = query.gte("starts_at", dayStart.toISOString()).lt("starts_at", dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar agenda: ${error.message}`);
  return (data as AppointmentRow[]).map(appointmentFromRow);
}

export interface StaffAppointmentDetails extends Appointment {
  serviceName: string;
  professionalName: string;
  clientName: string;
}

/**
 * Same as listAppointmentsForStaff, joined with service/professional names
 * plus client names for the agenda screen. Client names come from a
 * separate `profiles` lookup rather than a PostgREST embed — appointments
 * .client_id and profiles.id both reference auth.users(id) independently,
 * there's no direct FK edge between appointments and profiles for
 * PostgREST to embed across.
 */
export async function listAppointmentsForStaffWithDetails(
  supabase: SupabaseClient,
  options: { date?: string } = {}
): Promise<StaffAppointmentDetails[]> {
  let query = supabase
    .from("appointments")
    .select("*, services(name), professionals(full_name)")
    .order("starts_at", { ascending: true });

  if (options.date) {
    const dayStart = wallTimeToUtcDate(options.date, 0, companyConfig.timezone);
    const dayEnd = wallTimeToUtcDate(options.date, 24 * 60, companyConfig.timezone);
    query = query.gte("starts_at", dayStart.toISOString()).lt("starts_at", dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar agenda: ${error.message}`);

  const rows = data as unknown as (AppointmentRow & {
    services: { name: string } | null;
    professionals: { full_name: string } | null;
  })[];

  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const clientNames = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase.from("profiles").select("id, full_name").in("id", clientIds);
    if (profilesError) throw new Error(`Falha ao carregar clientes: ${profilesError.message}`);
    for (const row of profileRows as { id: string; full_name: string | null }[]) {
      clientNames.set(row.id, row.full_name ?? "Cliente");
    }
  }

  return rows.map((row) => ({
    ...appointmentFromRow(row),
    serviceName: row.services?.name ?? "Serviço removido",
    professionalName: row.professionals?.full_name ?? "Profissional removido",
    clientName: clientNames.get(row.client_id) ?? "Cliente",
  }));
}

/** RLS enforces who may cancel which row (owner or staff) — this just performs the status transition. */
export async function cancelAppointment(supabase: SupabaseClient, appointmentId: string): Promise<void> {
  const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId);
  if (error) throw new Error(`Falha ao cancelar agendamento: ${error.message}`);
}
