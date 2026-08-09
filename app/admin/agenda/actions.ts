"use server";

import { revalidatePath } from "next/cache";

import { availableSlotsQuerySchema, cancelAppointmentSchema, createAppointmentSchema } from "@/lib/validations/booking";
import { createClient } from "@/lib/supabase/server";
import { cancelAppointment, createAppointment } from "@/services/booking/appointment-repository";
import { getAvailableSlots, type AvailableSlot } from "@/services/booking/availability-repository";
import { listProfessionalsForService } from "@/services/professionals-repository";
import { searchClients } from "@/services/profiles-repository";
import type { Professional, Profile } from "@/types";

export interface ActionResult<T = undefined> {
  error: string | null;
  data?: T;
}

async function requireStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

export async function searchClientsAction(query: string): Promise<ActionResult<Profile[]>> {
  try {
    const { supabase } = await requireStaffUser();
    const clients = await searchClients(supabase, query);
    return { error: null, data: clients };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível buscar clientes." };
  }
}

export async function getProfessionalsForServiceAction(serviceId: string): Promise<ActionResult<Professional[]>> {
  try {
    const { supabase } = await requireStaffUser();
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
    const { supabase } = await requireStaffUser();
    const slots = await getAvailableSlots(supabase, parsed.data);
    return { error: null, data: slots };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível carregar os horários." };
  }
}

/** Staff booking on behalf of a client — clientId is required here (unlike the public flow, which always uses the session's own user). */
export async function createManualAppointmentAction(input: unknown): Promise<ActionResult> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  if (!parsed.data.clientId) return { error: "Selecione um cliente." };

  try {
    const { supabase, userId } = await requireStaffUser();
    await createAppointment(supabase, {
      professionalId: parsed.data.professionalId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      startTime: parsed.data.startTime,
      clientId: parsed.data.clientId,
      createdBy: userId,
      notes: parsed.data.notes,
    });
    revalidatePath("/admin/agenda");
    revalidatePath("/admin");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o agendamento." };
  }
}

export async function cancelAppointmentAction(input: unknown): Promise<ActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase } = await requireStaffUser();
    await cancelAppointment(supabase, parsed.data.appointmentId);
    revalidatePath("/admin/agenda");
    revalidatePath("/admin");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível cancelar o agendamento." };
  }
}
