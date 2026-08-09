"use server";

import { revalidatePath } from "next/cache";

import { serviceSchema } from "@/lib/validations/service";
import { createClient } from "@/lib/supabase/server";
import { createService, deleteService, updateService } from "@/services/services-repository";

export interface ActionResult {
  error: string | null;
}

export async function createServiceAction(input: unknown): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    await createService(supabase, parsed.data);
    revalidatePath("/admin/servicos");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o serviço." };
  }
}

export async function updateServiceAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    await updateService(supabase, id, parsed.data);
    revalidatePath("/admin/servicos");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível atualizar o serviço." };
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await deleteService(supabase, id);
    revalidatePath("/admin/servicos");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover o serviço." };
  }
}
