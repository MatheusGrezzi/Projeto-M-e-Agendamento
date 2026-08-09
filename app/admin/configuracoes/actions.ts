"use server";

import { revalidatePath } from "next/cache";

import { businessHoursSchema } from "@/lib/validations/business-hours";
import { createClient } from "@/lib/supabase/server";
import { updateBusinessHours } from "@/services/business-hours-repository";

export interface ActionResult {
  error: string | null;
}

export async function updateBusinessHoursAction(settingsId: string, input: unknown): Promise<ActionResult> {
  const parsed = businessHoursSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    await updateBusinessHours(supabase, settingsId, parsed.data);
    revalidatePath("/admin/configuracoes");
    revalidatePath("/contato");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar o horário de funcionamento." };
  }
}
