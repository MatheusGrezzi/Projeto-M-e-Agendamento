import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { activityLogFromRow, type ActivityLogRow } from "@/lib/mappers";
import type { ActivityLogEntry } from "@/types";

export async function logActivity(
  supabase: SupabaseClient,
  entry: {
    organizationId: string;
    userId: string | null;
    clientId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    organization_id: entry.organizationId,
    user_id: entry.userId,
    client_id: entry.clientId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
  });
  // Audit logging must never break the primary write it's attached to.
  if (error) console.error(`Falha ao registrar atividade: ${error.message}`);
}

export async function listRecentActivity(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 10
): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, user:profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar atividades: ${error.message}`);
  return (data as unknown as ActivityLogRow[]).map(activityLogFromRow);
}

export async function listClientActivity(supabase: SupabaseClient, clientId: string, limit = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, user:profiles(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar histórico do cliente: ${error.message}`);
  return (data as unknown as ActivityLogRow[]).map(activityLogFromRow);
}
