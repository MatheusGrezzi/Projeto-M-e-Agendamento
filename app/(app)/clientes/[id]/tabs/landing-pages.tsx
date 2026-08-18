import { LandingPagesForm } from "./landing-pages-form";
import { createClient } from "@/lib/supabase/server";
import { listEquipment, listSegments, listServiceTypes } from "@/services/catalog-repository";
import { listClientLandingPages } from "@/services/client-landing-pages-repository";

export async function LandingPagesTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const supabase = await createClient();
  const [segments, equipment, serviceTypes, pages] = await Promise.all([
    listSegments(supabase),
    listEquipment(supabase, organizationId),
    listServiceTypes(supabase, organizationId),
    listClientLandingPages(supabase, clientId),
  ]);

  return <LandingPagesForm clientId={clientId} segments={segments} equipment={equipment} serviceTypes={serviceTypes} pages={pages} />;
}
