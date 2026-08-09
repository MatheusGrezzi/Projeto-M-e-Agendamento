import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { clientRecordFromRow, profileFromRow, type ClientRecordRow, type ProfileRow } from "@/lib/mappers";
import type { UpdateClientDetailsInput } from "@/lib/validations/client";
import type { ClientRecord, Profile } from "@/types";

/** Staff-only (relies on the "staff can select all profiles" RLS policy). */
export async function listClients(supabase: SupabaseClient, query = ""): Promise<Profile[]> {
  let dbQuery = supabase.from("profiles").select("*").eq("role", "cliente").order("full_name", { ascending: true });
  if (query.trim()) dbQuery = dbQuery.ilike("full_name", `%${query.trim()}%`);

  const { data, error } = await dbQuery;
  if (error) throw new Error(`Falha ao carregar clientes: ${error.message}`);
  return (data as ProfileRow[]).map(profileFromRow);
}

export async function getClient(supabase: SupabaseClient, clientId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", clientId).maybeSingle();
  if (error) throw new Error(`Falha ao carregar cliente: ${error.message}`);
  return data ? profileFromRow(data as ProfileRow) : null;
}

export async function updateClientDetails(supabase: SupabaseClient, clientId: string, input: UpdateClientDetailsInput): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      cpf: input.cpf || null,
      health_insurance: input.healthInsurance || null,
      allergies_notes: input.allergiesNotes || null,
    })
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
  return profileFromRow(data as ProfileRow);
}

/** Running clinical history (prontuário) for a client — staff-only, newest first. */
export async function listClientRecords(supabase: SupabaseClient, clientId: string): Promise<ClientRecord[]> {
  const { data, error } = await supabase
    .from("client_records")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar prontuário: ${error.message}`);
  return (data as ClientRecordRow[]).map(clientRecordFromRow);
}

export async function addClientRecord(supabase: SupabaseClient, clientId: string, authorId: string, content: string): Promise<ClientRecord> {
  const { data, error } = await supabase
    .from("client_records")
    .insert({ client_id: clientId, author_id: authorId, content })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao salvar anotação: ${error.message}`);
  return clientRecordFromRow(data as ClientRecordRow);
}
