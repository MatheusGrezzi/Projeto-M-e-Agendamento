import { ConversoesForm } from "./conversoes-form";
import { createClient } from "@/lib/supabase/server";
import { listClientConversions } from "@/services/client-conversions-repository";

export async function ConversoesTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const conversions = await listClientConversions(supabase, clientId);
  return <ConversoesForm clientId={clientId} conversions={conversions} />;
}
