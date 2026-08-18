import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientExcludedEquipmentFromRow, type ClientExcludedEquipmentRow } from "@/lib/mappers";
import type { ClientExcludedEquipmentInput } from "@/lib/validations/client-relations";
import type { ClientExcludedEquipment } from "@/types";

export async function getClientEquipmentIds(supabase: SupabaseClient, clientId: string): Promise<string[]> {
  const { data, error } = await supabase.from("client_equipment").select("equipment_id").eq("client_id", clientId);
  if (error) throw new Error(`Falha ao carregar equipamentos do cliente: ${error.message}`);
  return (data as { equipment_id: string }[]).map((r) => r.equipment_id);
}

/** Replace-all: the equipment picker is a checkbox list, so each save reconciles the full set. */
export async function setClientEquipment(supabase: SupabaseClient, clientId: string, equipmentIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from("client_equipment").delete().eq("client_id", clientId);
  if (deleteError) throw new Error(`Falha ao atualizar equipamentos: ${deleteError.message}`);

  if (equipmentIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("client_equipment")
    .insert(equipmentIds.map((equipmentId) => ({ client_id: clientId, equipment_id: equipmentId })));
  if (insertError) throw new Error(`Falha ao atualizar equipamentos: ${insertError.message}`);
}

export async function listClientExcludedEquipment(supabase: SupabaseClient, clientId: string): Promise<ClientExcludedEquipment[]> {
  const { data, error } = await supabase
    .from("client_excluded_equipment")
    .select("*, equipment:equipment(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar restrições de equipamento: ${error.message}`);
  return (data as unknown as ClientExcludedEquipmentRow[]).map(clientExcludedEquipmentFromRow);
}

export async function addClientExcludedEquipment(
  supabase: SupabaseClient,
  clientId: string,
  input: ClientExcludedEquipmentInput
): Promise<void> {
  const { error } = await supabase
    .from("client_excluded_equipment")
    .insert({ client_id: clientId, equipment_id: input.equipmentId, label: input.label, notes: input.notes });
  if (error) throw new Error(`Falha ao adicionar restrição: ${error.message}`);
}

export async function removeClientExcludedEquipment(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_excluded_equipment").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover restrição: ${error.message}`);
}
