import { MarcasForm } from "./marcas-form";
import { createClient } from "@/lib/supabase/server";
import { listBrands } from "@/services/catalog-repository";
import { listClientBrandStatuses } from "@/services/client-brands-repository";
import type { Client } from "@/types";

export async function MarcasTab({ client }: { client: Client }) {
  const supabase = await createClient();
  const [brands, statuses] = await Promise.all([
    listBrands(supabase, client.organizationId),
    listClientBrandStatuses(supabase, client.id),
  ]);

  return <MarcasForm client={client} brands={brands} statuses={statuses} />;
}
