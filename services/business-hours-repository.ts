import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { companySettingsFromRow, type CompanySettingsRow } from "@/lib/mappers";
import type { BusinessHoursInput } from "@/lib/validations/business-hours";
import type { CompanySettings } from "@/types";

/** company_settings is a single-row table, seeded by migration — this always resolves to that one row. */
export async function getCompanySettings(supabase: SupabaseClient): Promise<CompanySettings | null> {
  const { data, error } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(`Falha ao carregar configurações: ${error.message}`);
  return data ? companySettingsFromRow(data as CompanySettingsRow) : null;
}

export async function updateBusinessHours(supabase: SupabaseClient, id: string, businessHours: BusinessHoursInput): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("company_settings")
    .update({ business_hours: businessHours })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao atualizar horário de funcionamento: ${error.message}`);
  return companySettingsFromRow(data as CompanySettingsRow);
}
