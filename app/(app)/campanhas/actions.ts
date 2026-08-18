"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createCampaignSchema } from "@/lib/validations/campaign";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createCampaignWithStrategy, getCampaign, regenerateCampaignStrategy } from "@/services/campaigns-repository";
import { logActivity } from "@/services/activity-log-repository";
import { getMyOrganization } from "@/services/organizations-repository";

export interface ActionResult {
  error: string | null;
}

export async function generateCampaignStrategyAction(input: unknown): Promise<ActionResult> {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let campaignId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada." };

    const org = await getMyOrganization(supabase, user.id);
    if (!org) return { error: "Você não está associado a nenhuma organização." };

    const result = await createCampaignWithStrategy(
      supabase,
      {
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        segmentId: parsed.data.segmentId,
        equipmentIds: parsed.data.equipmentIds,
        clientServiceIds: parsed.data.clientServiceIds,
        clientLocationIds: parsed.data.clientLocationIds,
        dailyBudget: parsed.data.dailyBudget,
        objective: parsed.data.objective,
        notes: parsed.data.notes,
      },
      user.id
    );
    campaignId = result.campaignId;

    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: parsed.data.clientId,
      action: `gerou a estratégia da campanha "${parsed.data.name}"`,
      entityType: "campaign",
      entityId: campaignId,
    });

    revalidatePath("/campanhas");
    revalidatePath(`/clientes/${parsed.data.clientId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar a estratégia." };
  }

  redirect(`/campanhas/${campaignId}`);
}

export async function regenerateCampaignStrategyAction(campaignId: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada." };

    const campaign = await getCampaign(supabase, campaignId);
    if (!campaign) return { error: "Campanha não encontrada." };

    const org = await getMyOrganization(supabase, user.id);
    if (!org) return { error: "Você não está associado a nenhuma organização." };

    await regenerateCampaignStrategy(supabase, campaignId, user.id);

    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: campaign.clientId,
      action: `gerou uma nova versão da estratégia de "${campaign.name}"`,
      entityType: "campaign",
      entityId: campaignId,
    });

    revalidatePath(`/campanhas/${campaignId}`);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar uma nova versão." };
  }
}
