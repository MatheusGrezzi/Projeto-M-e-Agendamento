import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientFromRow, clientListItemFromRow, type ClientRow } from "@/lib/mappers";
import type { ClientCompanyInput, ClientGoalsInput } from "@/lib/validations/client";
import type { Client, ClientListItem } from "@/types";

export async function listClients(supabase: SupabaseClient, organizationId: string): Promise<ClientListItem[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, trade_name, status, primary_city, daily_budget, updated_at, client_segments(segment:segments(label))")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar clientes: ${error.message}`);

  return (data as unknown as (ClientRow & { updated_at: string; client_segments: { segment: { label: string } | null }[] })[]).map(
    (row) => {
      const segments = row.client_segments.map((cs) => cs.segment?.label).filter((label): label is string => Boolean(label));
      return clientListItemFromRow(row, segments, row.updated_at);
    }
  );
}

export async function getClient(supabase: SupabaseClient, clientId: string): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (error) throw new Error(`Falha ao carregar cliente: ${error.message}`);
  return data ? clientFromRow(data as ClientRow) : null;
}

export async function createClient(
  supabase: SupabaseClient,
  organizationId: string,
  input: ClientCompanyInput
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: input.name,
      trade_name: input.tradeName,
      cnpj: input.cnpj,
      website: input.website,
      whatsapp: input.whatsapp,
      phone: input.phone,
      email: input.email,
      business_hours: input.businessHours,
      notes: input.notes,
      primary_city: input.primaryCity,
      primary_state: input.primaryState,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
  return clientFromRow(data as ClientRow);
}

export async function updateClientCompany(supabase: SupabaseClient, clientId: string, input: ClientCompanyInput): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      trade_name: input.tradeName,
      cnpj: input.cnpj,
      website: input.website,
      whatsapp: input.whatsapp,
      phone: input.phone,
      email: input.email,
      business_hours: input.businessHours,
      notes: input.notes,
      primary_city: input.primaryCity,
      primary_state: input.primaryState,
    })
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
  return clientFromRow(data as ClientRow);
}

export async function updateClientGoals(supabase: SupabaseClient, clientId: string, input: ClientGoalsInput): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      daily_budget: input.dailyBudget,
      monthly_budget_estimate: input.monthlyBudgetEstimate,
      average_ticket: input.averageTicket,
      lead_goal: input.leadGoal,
      cpl_goal: input.cplGoal,
      closed_services_goal: input.closedServicesGoal,
      cpa_goal: input.cpaGoal,
      roas_goal: input.roasGoal,
    })
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar metas: ${error.message}`);
  return clientFromRow(data as ClientRow);
}

export async function updateClientStatus(supabase: SupabaseClient, clientId: string, status: Client["status"]): Promise<void> {
  const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);
  if (error) throw new Error(`Falha ao atualizar status: ${error.message}`);
}

export async function deleteClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(`Falha ao excluir cliente: ${error.message}`);
}

export async function countClientsByStatus(
  supabase: SupabaseClient,
  organizationId: string
): Promise<Record<Client["status"], number>> {
  const { data, error } = await supabase.from("clients").select("status").eq("organization_id", organizationId);
  if (error) throw new Error(`Falha ao contar clientes: ${error.message}`);

  const counts: Record<Client["status"], number> = { onboarding: 0, active: 0, paused: 0, churned: 0 };
  for (const row of data as { status: Client["status"] }[]) counts[row.status]++;
  return counts;
}
