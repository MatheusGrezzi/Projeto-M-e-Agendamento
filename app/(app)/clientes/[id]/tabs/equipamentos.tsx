import { EquipamentosForm } from "./equipamentos-form";
import { createClient } from "@/lib/supabase/server";
import { listEquipment, listSegments } from "@/services/catalog-repository";
import { getClientEquipmentIds } from "@/services/client-equipment-repository";

export async function EquipamentosTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const supabase = await createClient();
  const [segments, equipment, selectedIds] = await Promise.all([
    listSegments(supabase),
    listEquipment(supabase, organizationId),
    getClientEquipmentIds(supabase, clientId),
  ]);

  return <EquipamentosForm clientId={clientId} segments={segments} equipment={equipment} selectedIds={selectedIds} />;
}
