"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { clientCompanySchema } from "@/lib/validations/client";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createClientRecord, deleteClient } from "@/services/clients-repository";
import { getMyOrganization } from "@/services/organizations-repository";
import { logActivity } from "@/services/activity-log-repository";

export interface ActionResult {
  error: string | null;
}

export async function createClientAction(input: unknown): Promise<ActionResult> {
  const parsed = clientCompanySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let clientId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada." };

    const org = await getMyOrganization(supabase, user.id);
    if (!org) return { error: "Você não está associado a nenhuma organização." };

    const client = await createClientRecord(supabase, org.id, parsed.data);
    clientId = client.id;
    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: client.id,
      action: "criou o cliente",
      entityType: "client",
      entityId: client.id,
    });
    revalidatePath("/clientes");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o cliente." };
  }

  redirect(`/clientes/${clientId}`);
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    await deleteClient(supabase, id);
    revalidatePath("/clientes");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível excluir o cliente." };
  }
}
