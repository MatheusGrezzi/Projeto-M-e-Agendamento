import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientExcludedServiceFromRow, clientServiceOfferingFromRow } from "@/lib/mappers";
import type { ClientExcludedServiceRow, ClientServiceOfferingRow } from "@/lib/mappers";
import type { ClientExcludedServiceInput, ClientServiceOfferingInput } from "@/lib/validations/client-relations";
import type { ClientExcludedService, ClientServiceOffering } from "@/types";

export async function listClientServiceOfferings(supabase: SupabaseClient, clientId: string): Promise<ClientServiceOffering[]> {
  const { data, error } = await supabase
    .from("client_services")
    .select("*, equipment:equipment(name), service:services(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar serviços realizados: ${error.message}`);
  return (data as unknown as ClientServiceOfferingRow[]).map(clientServiceOfferingFromRow);
}

export async function addClientServiceOffering(
  supabase: SupabaseClient,
  clientId: string,
  input: ClientServiceOfferingInput
): Promise<void> {
  const { error } = await supabase
    .from("client_services")
    .insert({ client_id: clientId, equipment_id: input.equipmentId, service_id: input.serviceId, notes: input.notes });
  if (error) {
    if (error.code === "23505") throw new Error("Essa combinação de equipamento e serviço já foi cadastrada.");
    throw new Error(`Falha ao adicionar serviço: ${error.message}`);
  }
}

export async function removeClientServiceOffering(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_services").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover serviço: ${error.message}`);
}

export async function listClientExcludedServices(supabase: SupabaseClient, clientId: string): Promise<ClientExcludedService[]> {
  const { data, error } = await supabase
    .from("client_excluded_services")
    .select("*, equipment:equipment(name), service:services(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar restrições de serviço: ${error.message}`);
  return (data as unknown as ClientExcludedServiceRow[]).map(clientExcludedServiceFromRow);
}

export async function addClientExcludedService(
  supabase: SupabaseClient,
  clientId: string,
  input: ClientExcludedServiceInput
): Promise<void> {
  const { error } = await supabase.from("client_excluded_services").insert({
    client_id: clientId,
    equipment_id: input.equipmentId,
    service_id: input.serviceId,
    label: input.label,
    notes: input.notes,
  });
  if (error) throw new Error(`Falha ao adicionar restrição: ${error.message}`);
}

export async function removeClientExcludedService(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_excluded_services").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover restrição: ${error.message}`);
}
