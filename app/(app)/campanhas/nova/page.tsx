import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { CampaignWizard } from "./campaign-wizard";
import { createClient } from "@/lib/supabase/server";
import { listSegments } from "@/services/catalog-repository";
import { getWizardClientsData } from "@/services/campaigns-repository";
import { getMyOrganization } from "@/services/organizations-repository";

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) redirect("/login");

  const [segments, clients] = await Promise.all([listSegments(supabase), getWizardClientsData(supabase, org.id)]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nova campanha" description="O Estrategista só usa o que o cliente tem cadastrado — nada é inventado." />
      <CampaignWizard segments={segments} clients={clients} />
    </div>
  );
}
