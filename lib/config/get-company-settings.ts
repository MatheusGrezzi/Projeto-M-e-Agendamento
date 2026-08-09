import "server-only";

import { getCompanySettings as fetchCompanySettings } from "@/services/business-hours-repository";
import { createClient } from "@/lib/supabase/server";
import { companyConfig, type BusinessHours } from "./company-config";

/**
 * The one runtime merge point in the whole config system: everything else in
 * companyConfig is used as-is (file-based, edited per client duplication).
 * Business hours are the single DB-editable field in MVP, so this fetches
 * the company_settings row and falls back to businessHoursFallback if the
 * row is missing or the query fails — defensive, since a fresh clone's DB
 * might not be seeded yet.
 */
export async function getCompanySettings(): Promise<{ businessHours: BusinessHours; settingsId: string | null }> {
  try {
    const supabase = await createClient();
    const settings = await fetchCompanySettings(supabase);
    if (!settings) {
      return { businessHours: [...companyConfig.businessHoursFallback], settingsId: null };
    }
    return { businessHours: settings.businessHours, settingsId: settings.id };
  } catch {
    return { businessHours: [...companyConfig.businessHoursFallback], settingsId: null };
  }
}
