import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getClientSegmentIds(supabase: SupabaseClient, clientId: string): Promise<string[]> {
  const { data, error } = await supabase.from("client_segments").select("segment_id").eq("client_id", clientId);
  if (error) throw new Error(`Falha ao carregar segmentos do cliente: ${error.message}`);
  return (data as { segment_id: string }[]).map((r) => r.segment_id);
}

/** Replace-all: the segments picker is a checkbox list, so each save reconciles the full set. */
export async function setClientSegments(supabase: SupabaseClient, clientId: string, segmentIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from("client_segments").delete().eq("client_id", clientId);
  if (deleteError) throw new Error(`Falha ao atualizar segmentos: ${deleteError.message}`);

  if (segmentIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("client_segments")
    .insert(segmentIds.map((segmentId) => ({ client_id: clientId, segment_id: segmentId })));
  if (insertError) throw new Error(`Falha ao atualizar segmentos: ${insertError.message}`);
}
