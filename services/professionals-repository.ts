import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { professionalFromRow, workingHoursFromRow, type ProfessionalRow, type ProfessionalWorkingHoursRow } from "@/lib/mappers";
import type { ProfessionalInput, WorkingHoursEntryInput } from "@/lib/validations/professional";
import type { Professional, ProfessionalWorkingHours } from "@/types";

export async function listProfessionals(
  supabase: SupabaseClient,
  options: { includeInactive?: boolean } = {}
): Promise<Professional[]> {
  let query = supabase.from("professionals").select("*").order("display_order", { ascending: true });
  if (!options.includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar profissionais: ${error.message}`);
  return (data as ProfessionalRow[]).map(professionalFromRow);
}

export async function getProfessional(supabase: SupabaseClient, id: string): Promise<Professional | null> {
  const { data, error } = await supabase.from("professionals").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao carregar profissional: ${error.message}`);
  return data ? professionalFromRow(data as ProfessionalRow) : null;
}

export async function listServiceIdsForProfessional(supabase: SupabaseClient, professionalId: string): Promise<string[]> {
  const { data, error } = await supabase.from("professional_services").select("service_id").eq("professional_id", professionalId);
  if (error) throw new Error(`Falha ao carregar serviços do profissional: ${error.message}`);
  return (data as { service_id: string }[]).map((row) => row.service_id);
}

export async function listProfessionalsForService(supabase: SupabaseClient, serviceId: string): Promise<Professional[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select("professionals(*)")
    .eq("service_id", serviceId);

  if (error) throw new Error(`Falha ao carregar profissionais do serviço: ${error.message}`);
  return (data as unknown as { professionals: ProfessionalRow }[])
    .map((row) => row.professionals)
    .filter((row) => row.active)
    .map(professionalFromRow);
}

async function setProfessionalServices(supabase: SupabaseClient, professionalId: string, serviceIds: string[]) {
  const { error: deleteError } = await supabase.from("professional_services").delete().eq("professional_id", professionalId);
  if (deleteError) throw new Error(`Falha ao atualizar serviços do profissional: ${deleteError.message}`);

  if (serviceIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("professional_services")
    .insert(serviceIds.map((serviceId) => ({ professional_id: professionalId, service_id: serviceId })));
  if (insertError) throw new Error(`Falha ao atualizar serviços do profissional: ${insertError.message}`);
}

export async function createProfessional(supabase: SupabaseClient, input: ProfessionalInput): Promise<Professional> {
  const { data, error } = await supabase
    .from("professionals")
    .insert({
      full_name: input.fullName,
      bio: input.bio || null,
      photo_url: input.photoUrl || null,
      active: input.active,
      display_order: input.displayOrder,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar profissional: ${error.message}`);
  const professional = professionalFromRow(data as ProfessionalRow);
  await setProfessionalServices(supabase, professional.id, input.serviceIds);
  return professional;
}

export async function updateProfessional(supabase: SupabaseClient, id: string, input: ProfessionalInput): Promise<Professional> {
  const { data, error } = await supabase
    .from("professionals")
    .update({
      full_name: input.fullName,
      bio: input.bio || null,
      photo_url: input.photoUrl || null,
      active: input.active,
      display_order: input.displayOrder,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar profissional: ${error.message}`);
  await setProfessionalServices(supabase, id, input.serviceIds);
  return professionalFromRow(data as ProfessionalRow);
}

export async function deleteProfessional(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("professionals").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover profissional: ${error.message}`);
}

export async function listWorkingHours(supabase: SupabaseClient, professionalId: string): Promise<ProfessionalWorkingHours[]> {
  const { data, error } = await supabase
    .from("professional_working_hours")
    .select("*")
    .eq("professional_id", professionalId)
    .order("weekday", { ascending: true });

  if (error) throw new Error(`Falha ao carregar horários: ${error.message}`);
  return (data as ProfessionalWorkingHoursRow[]).map(workingHoursFromRow);
}

/** Replaces all working-hours windows for a professional with the given set (supports multiple windows per weekday, e.g. a lunch break). */
export async function setWorkingHours(supabase: SupabaseClient, professionalId: string, entries: WorkingHoursEntryInput[]): Promise<void> {
  const { error: deleteError } = await supabase.from("professional_working_hours").delete().eq("professional_id", professionalId);
  if (deleteError) throw new Error(`Falha ao atualizar horários: ${deleteError.message}`);

  if (entries.length === 0) return;

  const { error: insertError } = await supabase.from("professional_working_hours").insert(
    entries.map((entry) => ({
      professional_id: professionalId,
      weekday: entry.weekday,
      start_time: entry.startTime,
      end_time: entry.endTime,
    }))
  );
  if (insertError) throw new Error(`Falha ao atualizar horários: ${insertError.message}`);
}
