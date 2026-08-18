"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { clientCompanySchema, clientGoalsSchema } from "@/lib/validations/client";
import { customBrandSchema, customEquipmentSchema, customServiceTypeSchema } from "@/lib/validations/catalog";
import {
  clientBrandStatusSchema,
  clientConversionSchema,
  clientExcludedEquipmentSchema,
  clientExcludedServiceSchema,
  clientLandingPageSchema,
  clientLocationSchema,
  clientServiceOfferingSchema,
} from "@/lib/validations/client-relations";
import { getClient, updateClientCompany, updateClientGoals, updateClientStatus } from "@/services/clients-repository";
import { createCustomBrand, createCustomEquipment, createCustomServiceType } from "@/services/catalog-repository";
import { setClientSegments } from "@/services/client-segments-repository";
import {
  addClientExcludedEquipment,
  removeClientExcludedEquipment,
  setClientEquipment,
} from "@/services/client-equipment-repository";
import {
  addClientExcludedService,
  addClientServiceOffering,
  removeClientExcludedService,
  removeClientServiceOffering,
} from "@/services/client-services-repository";
import { removeClientBrand, setClientBrandPolicy, setClientBrandStatus } from "@/services/client-brands-repository";
import { createClientLocation, deleteClientLocation } from "@/services/client-locations-repository";
import { createClientLandingPage, deleteClientLandingPage } from "@/services/client-landing-pages-repository";
import { createClientConversion, deleteClientConversion } from "@/services/client-conversions-repository";
import { logActivity } from "@/services/activity-log-repository";
import type { ClientStatus } from "@/types";

export interface ActionResult {
  error: string | null;
}

async function getActionContext(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const client = await getClient(supabase, clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  return { supabase, user, client };
}

function revalidateClient(clientId: string) {
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function updateClientCompanyAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientCompanySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await updateClientCompany(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "atualizou os dados da empresa",
      entityType: "client",
      entityId: clientId,
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function updateClientStatusAction(clientId: string, status: ClientStatus): Promise<ActionResult> {
  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await updateClientStatus(supabase, clientId, status);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: `mudou o status para ${status}`,
      entityType: "client",
      entityId: clientId,
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function updateClientGoalsAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientGoalsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await updateClientGoals(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "atualizou orçamento e metas",
      entityType: "client",
      entityId: clientId,
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function setClientSegmentsAction(clientId: string, segmentIds: string[]): Promise<ActionResult> {
  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await setClientSegments(supabase, clientId, segmentIds);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "atualizou os segmentos atendidos",
      entityType: "client_segments",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function setClientEquipmentAction(clientId: string, equipmentIds: string[]): Promise<ActionResult> {
  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await setClientEquipment(supabase, clientId, equipmentIds);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "atualizou os equipamentos atendidos",
      entityType: "client_equipment",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function createCustomEquipmentAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = customEquipmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, client } = await getActionContext(clientId);
    await createCustomEquipment(supabase, client.organizationId, parsed.data);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o equipamento." };
  }
}

export async function addClientExcludedEquipmentAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientExcludedEquipmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await addClientExcludedEquipment(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "adicionou uma restrição de equipamento",
      entityType: "client_excluded_equipment",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function removeClientExcludedEquipmentAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await removeClientExcludedEquipment(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function createCustomServiceTypeAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = customServiceTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, client } = await getActionContext(clientId);
    await createCustomServiceType(supabase, client.organizationId, parsed.data);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar o serviço." };
  }
}

export async function addClientServiceOfferingAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientServiceOfferingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await addClientServiceOffering(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "adicionou um serviço realizado",
      entityType: "client_services",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function removeClientServiceOfferingAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await removeClientServiceOffering(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function addClientExcludedServiceAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientExcludedServiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await addClientExcludedService(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: "adicionou uma restrição de serviço",
      entityType: "client_excluded_services",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function removeClientExcludedServiceAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await removeClientExcludedService(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function createCustomBrandAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = customBrandSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, client } = await getActionContext(clientId);
    await createCustomBrand(supabase, client.organizationId, parsed.data);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar a marca." };
  }
}

export async function setClientBrandStatusAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientBrandStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase } = await getActionContext(clientId);
    await setClientBrandStatus(supabase, clientId, parsed.data);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function removeClientBrandAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await removeClientBrand(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function setClientBrandPolicyAction(clientId: string, policy: "no_restriction" | "specific"): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await setClientBrandPolicy(supabase, clientId, policy);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function createClientLocationAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await createClientLocation(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: `adicionou a região ${parsed.data.city}/${parsed.data.state}`,
      entityType: "client_locations",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function deleteClientLocationAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await deleteClientLocation(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function createClientLandingPageAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientLandingPageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await createClientLandingPage(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: `adicionou a landing page ${parsed.data.name}`,
      entityType: "client_landing_pages",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function deleteClientLandingPageAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await deleteClientLandingPage(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}

export async function createClientConversionAction(clientId: string, input: unknown): Promise<ActionResult> {
  const parsed = clientConversionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const { supabase, user, client } = await getActionContext(clientId);
    await createClientConversion(supabase, clientId, parsed.data);
    await logActivity(supabase, {
      organizationId: client.organizationId,
      userId: user.id,
      clientId,
      action: `adicionou a conversão ${parsed.data.name}`,
      entityType: "client_conversions",
    });
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
}

export async function deleteClientConversionAction(clientId: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getActionContext(clientId);
    await deleteClientConversion(supabase, id);
    revalidateClient(clientId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível remover." };
  }
}
