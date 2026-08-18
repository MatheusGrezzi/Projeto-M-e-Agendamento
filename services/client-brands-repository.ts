import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientBrandStatusFromRow, type ClientBrandStatusRow } from "@/lib/mappers";
import type { ClientBrandStatusInput } from "@/lib/validations/client-relations";
import type { ClientBrandStatus } from "@/types";

export async function listClientBrandStatuses(supabase: SupabaseClient, clientId: string): Promise<ClientBrandStatus[]> {
  const { data, error } = await supabase
    .from("client_brands")
    .select("*, brand:brands(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar marcas do cliente: ${error.message}`);
  return (data as unknown as ClientBrandStatusRow[]).map(clientBrandStatusFromRow);
}

/** Setting a client's first brand flips `clients.brand_policy` to 'specific' — enforced here, not in the DB. */
export async function setClientBrandStatus(supabase: SupabaseClient, clientId: string, input: ClientBrandStatusInput): Promise<void> {
  const { error } = await supabase
    .from("client_brands")
    .upsert({ client_id: clientId, brand_id: input.brandId, status: input.status }, { onConflict: "client_id,brand_id" });
  if (error) throw new Error(`Falha ao definir marca: ${error.message}`);

  const { error: policyError } = await supabase.from("clients").update({ brand_policy: "specific" }).eq("id", clientId);
  if (policyError) throw new Error(`Falha ao atualizar política de marcas: ${policyError.message}`);
}

export async function removeClientBrand(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("client_brands").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover marca: ${error.message}`);
}

export async function setClientBrandPolicy(
  supabase: SupabaseClient,
  clientId: string,
  policy: "no_restriction" | "specific"
): Promise<void> {
  const { error } = await supabase.from("clients").update({ brand_policy: policy }).eq("id", clientId);
  if (error) throw new Error(`Falha ao atualizar política de marcas: ${error.message}`);

  if (policy === "no_restriction") {
    const { error: deleteError } = await supabase.from("client_brands").delete().eq("client_id", clientId);
    if (deleteError) throw new Error(`Falha ao limpar marcas: ${deleteError.message}`);
  }
}
