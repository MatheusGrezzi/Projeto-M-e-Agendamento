import { SegmentosForm } from "./segmentos-form";
import { createClient } from "@/lib/supabase/server";
import { listSegments } from "@/services/catalog-repository";
import { getClientSegmentIds } from "@/services/client-segments-repository";

export async function SegmentosTab({ clientId }: { clientId: string; organizationId: string }) {
  const supabase = await createClient();
  const [segments, selectedIds] = await Promise.all([listSegments(supabase), getClientSegmentIds(supabase, clientId)]);

  return <SegmentosForm clientId={clientId} segments={segments} selectedIds={selectedIds} />;
}
