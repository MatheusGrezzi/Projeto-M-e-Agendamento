import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientConversionFromRow, type ClientConversionRow } from "@/lib/mappers";
import type { ClientConversionInput } from "@/lib/validations/client-relations";
import type { ClientConversion } from "@/types";

export async function listClientConversions(supabase: SupabaseClient, clientId: string): Promise<ClientConversion[]> {
  const { data, error } = await supabase
    .from("client_conversions")
    .select("*")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar conversões: ${error.message}`);
  return (data as ClientConversionRow[]).map(clientConversionFromRow);
}

export async function createClientConversion(supabase: SupabaseClient, clientId: string, input: ClientConversionInput): Promise<void> {
  const { error } = await supabase.from("client_conversions").insert({
    client_id: clientId,
    name: input.name,
    platform: input.platform,
    conversion_type: input.conversionType,
    external_id: input.externalId,
    status: input.status,
    is_primary: input.isPrimary,
    notes: input.notes,
  });
  if (error) throw new Error(`Falha ao adicionar conversão: ${error.message}`);
}

export async function updateClientConversion(supabase: SupabaseClient, id: string, input: ClientConversionInput): Promise<void> {
  const { error } = await supabase
    .from("client_conversions")
    .update({
      name: input.name,
      platform: input.platform,
      conversion_type: input.conversionType,
      external_id: input.externalId,
      status: input.status,
      is_primary: input.isPrimary,
      notes: input.notes,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar conversão: ${error.message}`);
}

export async function deleteClientConversion(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_conversions").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover conversão: ${error.message}`);
}
