"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createCampaignSchema, regenerateCampaignSchema } from "@/lib/validations/campaign";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createCampaignDraft, generateStrategyForCampaign, getCampaign } from "@/services/campaigns-repository";
import { logActivity } from "@/services/activity-log-repository";
import { getMyOrganization } from "@/services/organizations-repository";

export interface ActionResult {
  error: string | null;
  errors?: string[];
  warnings?: string[];
  campaignId?: string;
}

export async function generateCampaignStrategyAction(input: unknown): Promise<ActionResult> {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let campaignId: string;
  let result: Awaited<ReturnType<typeof generateStrategyForCampaign>>;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada." };

    const org = await getMyOrganization(supabase, user.id);
    if (!org) return { error: "Você não está associado a nenhuma organização." };

    campaignId = await createCampaignDraft(supabase, parsed.data, org.id, user.id);
    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: parsed.data.clientId,
      action: `criou a campanha "${parsed.data.name}"`,
      entityType: "campaign",
      entityId: campaignId,
    });

    result = await generateStrategyForCampaign(supabase, campaignId, user.id);
    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: parsed.data.clientId,
      action: result.ok
        ? `gerou a estratégia da campanha "${parsed.data.name}"`
        : `falhou ao gerar a estratégia da campanha "${parsed.data.name}"`,
      entityType: "campaign",
      entityId: campaignId,
    });

    revalidatePath("/campanhas");
    revalidatePath(`/clientes/${parsed.data.clientId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar a campanha." };
  }

  if (!result.ok) {
    return { error: "Não foi possível gerar a estratégia — o rascunho da campanha foi salvo.", errors: result.errors, warnings: result.warnings, campaignId };
  }

  redirect(`/campanhas/${campaignId}`);
}

export async function regenerateCampaignStrategyAction(campaignId: string, input: unknown): Promise<ActionResult> {
  const parsed = regenerateCampaignSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

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

    const result = await generateStrategyForCampaign(supabase, campaignId, user.id, parsed.data.reason);

    await logActivity(supabase, {
      organizationId: org.id,
      userId: user.id,
      clientId: campaign.clientId,
      action: result.ok
        ? `gerou uma nova versão da estratégia de "${campaign.name}"`
        : `falhou ao gerar uma nova versão da estratégia de "${campaign.name}"`,
      entityType: "campaign",
      entityId: campaignId,
    });

    revalidatePath(`/campanhas/${campaignId}`);

    if (!result.ok) return { error: result.errors.join(" "), errors: result.errors };
    return { error: null, warnings: result.warnings };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar uma nova versão." };
  }
}
