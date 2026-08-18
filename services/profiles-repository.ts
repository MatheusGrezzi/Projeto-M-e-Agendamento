import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { profileFromRow, type ProfileRow } from "@/lib/mappers";
import type { Profile } from "@/types";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) throw new Error(`Falha ao carregar perfil: ${error.message}`);
  return data ? profileFromRow(data as ProfileRow) : null;
}
