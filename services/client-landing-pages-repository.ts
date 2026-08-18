import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientLandingPageFromRow, type ClientLandingPageRow } from "@/lib/mappers";
import type { ClientLandingPageInput } from "@/lib/validations/client-relations";
import type { ClientLandingPage } from "@/types";

export async function listClientLandingPages(supabase: SupabaseClient, clientId: string): Promise<ClientLandingPage[]> {
  const { data, error } = await supabase
    .from("client_landing_pages")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar landing pages: ${error.message}`);
  return (data as ClientLandingPageRow[]).map(clientLandingPageFromRow);
}

export async function createClientLandingPage(
  supabase: SupabaseClient,
  clientId: string,
  input: ClientLandingPageInput
): Promise<void> {
  const { error } = await supabase.from("client_landing_pages").insert({
    client_id: clientId,
    name: input.name,
    url: input.url,
    segment_id: input.segmentId,
    equipment_id: input.equipmentId,
    service_id: input.serviceId,
    city: input.city,
    status: input.status,
  });
  if (error) throw new Error(`Falha ao adicionar landing page: ${error.message}`);
}

export async function updateClientLandingPage(supabase: SupabaseClient, id: string, input: ClientLandingPageInput): Promise<void> {
  const { error } = await supabase
    .from("client_landing_pages")
    .update({
      name: input.name,
      url: input.url,
      segment_id: input.segmentId,
      equipment_id: input.equipmentId,
      service_id: input.serviceId,
      city: input.city,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar landing page: ${error.message}`);
}

export async function deleteClientLandingPage(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_landing_pages").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover landing page: ${error.message}`);
}
