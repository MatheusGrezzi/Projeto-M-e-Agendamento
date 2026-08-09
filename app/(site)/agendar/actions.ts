"use server";

import { revalidatePath } from "next/cache";

import { availableSlotsQuerySchema, createAppointmentSchema } from "@/lib/validations/booking";
import { createClient } from "@/lib/supabase/server";
import { createAppointment } from "@/services/booking/appointment-repository";
import { getAvailableSlots, type AvailableSlot } from "@/services/booking/availability-repository";
import { listProfessionalsForService } from "@/services/professionals-repository";
import type { Professional } from "@/types";

export interface ActionResult<T = undefined> {
  error: string | null;
  data?: T;
}

export async function getProfessionalsForServiceAction(serviceId: string): Promise<ActionResult<Professional[]>> {
  try {
    const supabase = await createClient();
    const professionals = await listProfessionalsForService(supabase, serviceId);
    return { error: null, data: professionals };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível carregar os profissionais." };
  }
}

export async function getAvailableSlotsAction(input: unknown): Promise<ActionResult<AvailableSlot[]>> {
  const parsed = availableSlotsQuerySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    const slots = await getAvailableSlots(supabase, parsed.data);
    return { error: null, data: slots };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível carregar os horários." };
  }
}

/** Public flow always books for the session's own user — ignores any clientId in the input (that's only honored by the staff-facing admin action). */
export async function createAppointmentAction(input: unknown): Promise<ActionResult> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa entrar para confirmar o agendamento." };

  try {
    await createAppointment(supabase, {
      professionalId: parsed.data.professionalId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      startTime: parsed.data.startTime,
      clientId: user.id,
      createdBy: user.id,
      notes: parsed.data.notes,
    });
    revalidatePath("/minha-conta");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível confirmar o agendamento." };
  }
}
