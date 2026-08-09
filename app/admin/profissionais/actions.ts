"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { professionalSchema, workingHoursEntrySchema } from "@/lib/validations/professional";
import { createClient } from "@/lib/supabase/server";
import {
  createProfessional,
  deleteProfessional,
  listServiceIdsForProfessional,
  listWorkingHours,
  setWorkingHours,
  updateProfessional,
} from "@/services/professionals-repository";
import { listServices } from "@/services/services-repository";
import type { Professional, ProfessionalWorkingHours, Service } from "@/types";

export interface ActionResult {
  error: string | null;
}

const saveProfessionalSchema = z.object({
  professional: professionalSchema,
  workingHours: z.array(workingHoursEntrySchema),
});

export async function getServicesAction(): Promise<{ error: string | null; data?: Service[] }> {
  try {
    const supabase = await createClient();
    const services = await listServices(supabase, { includeInactive: true });
    return { error: null, data: services };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível carregar os serviços." };
  }
}

export async function getProfessionalDetailsAction(
  professionalId: string
): Promise<{ error: string | null; data?: { serviceIds: string[]; workingHours: ProfessionalWorkingHours[] } }> {
  try {
    const supabase = await createClient();
    const [serviceIds, workingHours] = await Promise.all([
      listServiceIdsForProfessional(supabase, professionalId),
      listWorkingHours(supabase, professionalId),
    ]);
    return { error: null, data: { serviceIds, workingHours } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível carregar o profissional." };
  }
}

export async function createProfessionalAction(input: unknown): Promise<ActionResult> {
  const parsed = saveProfessionalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    const professional: Professional = await createProfessional(supabase, parsed.data.professional);
    await setWorkingHours(supabase, professional.id, parsed.data.workingHours);
    revalidatePath("/admin/profissionais");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o profissional." };
  }
}

export async function updateProfessionalAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = saveProfessionalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const supabase = await createClient();
    await updateProfessional(supabase, id, parsed.data.professional);
    await setWorkingHours(supabase, id, parsed.data.workingHours);
    revalidatePath("/admin/profissionais");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível atualizar o profissional." };
  }
}

export async function deleteProfessionalAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await deleteProfessional(supabase, id);
    revalidatePath("/admin/profissionais");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover o profissional." };
  }
}
