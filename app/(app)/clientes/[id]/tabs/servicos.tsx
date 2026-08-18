import { ServicosForm } from "./servicos-form";
import { createClient } from "@/lib/supabase/server";
import { listEquipment, listServiceTypes } from "@/services/catalog-repository";
import { getClientEquipmentIds } from "@/services/client-equipment-repository";
import { listClientServiceOfferings } from "@/services/client-services-repository";

export async function ServicosTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const supabase = await createClient();
  const [equipment, serviceTypes, equipmentIds, offerings] = await Promise.all([
    listEquipment(supabase, organizationId),
    listServiceTypes(supabase, organizationId),
    getClientEquipmentIds(supabase, clientId),
    listClientServiceOfferings(supabase, clientId),
  ]);

  const clientEquipment = equipment.filter((e) => equipmentIds.includes(e.id));

  return <ServicosForm clientId={clientId} equipment={clientEquipment} serviceTypes={serviceTypes} offerings={offerings} />;
}
