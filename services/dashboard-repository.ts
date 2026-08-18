import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  pausedClients: number;
  campaignsPlanning: number;
  campaignsActive: number;
}

export async function getDashboardStats(supabase: SupabaseClient, organizationId: string): Promise<DashboardStats> {
  const [{ data: clientRows, error: clientsError }, { data: campaignRows, error: campaignsError }] = await Promise.all([
    supabase.from("clients").select("status").eq("organization_id", organizationId),
    supabase.from("campaigns").select("status").eq("organization_id", organizationId),
  ]);
  if (clientsError) throw new Error(`Falha ao carregar estatísticas: ${clientsError.message}`);
  if (campaignsError) throw new Error(`Falha ao carregar estatísticas de campanhas: ${campaignsError.message}`);

  const clients = clientRows as { status: string }[];
  const campaigns = campaignRows as { status: string }[];

  return {
    totalClients: clients.length,
    activeClients: clients.filter((r) => r.status === "active").length,
    onboardingClients: clients.filter((r) => r.status === "onboarding").length,
    pausedClients: clients.filter((r) => r.status === "paused").length,
    campaignsPlanning: campaigns.filter((c) => c.status === "draft" || c.status === "strategy_generated").length,
    campaignsActive: campaigns.filter((c) => c.status === "active").length,
  };
}
