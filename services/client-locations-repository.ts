import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientLocationFromRow, type ClientLocationRow } from "@/lib/mappers";
import type { ClientLocationInput } from "@/lib/validations/client-relations";
import type { ClientLocation } from "@/types";

export async function listClientLocations(supabase: SupabaseClient, clientId: string): Promise<ClientLocation[]> {
  const { data, error } = await supabase
    .from("client_locations")
    .select("*")
    .eq("client_id", clientId)
    .order("city", { ascending: true });
  if (error) throw new Error(`Falha ao carregar regiões: ${error.message}`);
  return (data as ClientLocationRow[]).map(clientLocationFromRow);
}

export async function createClientLocation(supabase: SupabaseClient, clientId: string, input: ClientLocationInput): Promise<void> {
  const { error } = await supabase.from("client_locations").insert({
    client_id: clientId,
    city: input.city,
    state: input.state,
    neighborhood: input.neighborhood,
    priority: input.priority,
    is_served: input.isServed,
  });
  if (error) throw new Error(`Falha ao adicionar região: ${error.message}`);
}

export async function updateClientLocation(supabase: SupabaseClient, id: string, input: ClientLocationInput): Promise<void> {
  const { error } = await supabase
    .from("client_locations")
    .update({
      city: input.city,
      state: input.state,
      neighborhood: input.neighborhood,
      priority: input.priority,
      is_served: input.isServed,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar região: ${error.message}`);
}

export async function deleteClientLocation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_locations").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover região: ${error.message}`);
}
