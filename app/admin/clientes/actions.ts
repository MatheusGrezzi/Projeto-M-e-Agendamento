"use server";

import { revalidatePath } from "next/cache";

import { createClientRecordSchema, updateClientDetailsSchema } from "@/lib/validations/client";
import { createClient } from "@/lib/supabase/server";
import { addClientRecord, updateClientDetails } from "@/services/clients-repository";

export interface ActionResult {
  error: string | null;
}

async function requireStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

export async function updateClientDetailsAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = updateClientDetailsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase } = await requireStaffUser();
    await updateClientDetails(supabase, clientId, parsed.data);
    revalidatePath(`/admin/clientes/${clientId}`);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar os dados do cliente." };
  }
}

export async function addClientRecordAction(input: unknown): Promise<ActionResult> {
  const parsed = createClientRecordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, userId } = await requireStaffUser();
    await addClientRecord(supabase, parsed.data.clientId, userId, parsed.data.content);
    revalidatePath(`/admin/clientes/${parsed.data.clientId}`);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar a anotação." };
  }
}
