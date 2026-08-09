import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serviceFromRow, type ServiceRow } from "@/lib/mappers";
import type { ServiceInput } from "@/lib/validations/service";
import type { Service } from "@/types";

export async function listServices(supabase: SupabaseClient, options: { includeInactive?: boolean } = {}): Promise<Service[]> {
  let query = supabase.from("services").select("*").order("display_order", { ascending: true });
  if (!options.includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar serviços: ${error.message}`);
  return (data as ServiceRow[]).map(serviceFromRow);
}

export async function getService(supabase: SupabaseClient, id: string): Promise<Service | null> {
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao carregar serviço: ${error.message}`);
  return data ? serviceFromRow(data as ServiceRow) : null;
}

export async function createService(supabase: SupabaseClient, input: ServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: input.name,
      description: input.description || null,
      duration_minutes: input.durationMinutes,
      price_cents: input.priceCents,
      active: input.active,
      display_order: input.displayOrder,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar serviço: ${error.message}`);
  return serviceFromRow(data as ServiceRow);
}

export async function updateService(supabase: SupabaseClient, id: string, input: ServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update({
      name: input.name,
      description: input.description || null,
      duration_minutes: input.durationMinutes,
      price_cents: input.priceCents,
      active: input.active,
      display_order: input.displayOrder,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar serviço: ${error.message}`);
  return serviceFromRow(data as ServiceRow);
}

export async function deleteService(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover serviço: ${error.message}`);
}
