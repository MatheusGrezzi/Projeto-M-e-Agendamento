import { RegioesForm } from "./regioes-form";
import { createClient } from "@/lib/supabase/server";
import { listClientLocations } from "@/services/client-locations-repository";

export async function RegioesTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const locations = await listClientLocations(supabase, clientId);
  return <RegioesForm clientId={clientId} locations={locations} />;
}
