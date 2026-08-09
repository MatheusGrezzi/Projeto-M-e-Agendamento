import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { profileFromRow, type ProfileRow } from "@/lib/mappers";
import type { Profile } from "@/types";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) throw new Error(`Falha ao carregar perfil: ${error.message}`);
  return data ? profileFromRow(data as ProfileRow) : null;
}

/** Staff-only (relies on the "staff can select all profiles" RLS policy) — used by the admin manual-booking client picker. */
export async function searchClients(supabase: SupabaseClient, query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "cliente")
    .ilike("full_name", `%${query}%`)
    .limit(10);

  if (error) throw new Error(`Falha ao buscar clientes: ${error.message}`);
  return (data as ProfileRow[]).map(profileFromRow);
}
