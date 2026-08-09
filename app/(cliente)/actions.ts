"use server";

import { revalidatePath } from "next/cache";

import { cancelAppointmentSchema } from "@/lib/validations/booking";
import { createClient } from "@/lib/supabase/server";
import { cancelAppointment } from "@/services/booking/appointment-repository";

export interface ActionResult {
  error: string | null;
}

export async function cancelAppointmentAction(input: unknown): Promise<ActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    // RLS enforces that only the owner (or staff) may update this row —
    // no manual ownership check needed here.
    await cancelAppointment(supabase, parsed.data.appointmentId);
    revalidatePath("/minha-conta");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível cancelar o agendamento." };
  }
}
