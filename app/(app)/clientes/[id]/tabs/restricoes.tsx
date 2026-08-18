import { RestricoesForm } from "./restricoes-form";
import { createClient } from "@/lib/supabase/server";
import { listEquipment, listServiceTypes } from "@/services/catalog-repository";
import { listClientExcludedEquipment } from "@/services/client-equipment-repository";
import { listClientExcludedServices } from "@/services/client-services-repository";

export async function RestricoesTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const supabase = await createClient();
  const [equipment, serviceTypes, excludedEquipment, excludedServices] = await Promise.all([
    listEquipment(supabase, organizationId),
    listServiceTypes(supabase, organizationId),
    listClientExcludedEquipment(supabase, clientId),
    listClientExcludedServices(supabase, clientId),
  ]);

  return (
    <RestricoesForm
      clientId={clientId}
      equipment={equipment}
      serviceTypes={serviceTypes}
      excludedEquipment={excludedEquipment}
      excludedServices={excludedServices}
    />
  );
}
