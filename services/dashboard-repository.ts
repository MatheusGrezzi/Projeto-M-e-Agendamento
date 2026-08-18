import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  pausedClients: number;
}

export async function getDashboardStats(supabase: SupabaseClient, organizationId: string): Promise<DashboardStats> {
  const { data, error } = await supabase.from("clients").select("status").eq("organization_id", organizationId);
  if (error) throw new Error(`Falha ao carregar estatísticas: ${error.message}`);

  const rows = data as { status: string }[];
  return {
    totalClients: rows.length,
    activeClients: rows.filter((r) => r.status === "active").length,
    onboardingClients: rows.filter((r) => r.status === "onboarding").length,
    pausedClients: rows.filter((r) => r.status === "paused").length,
  };
}
