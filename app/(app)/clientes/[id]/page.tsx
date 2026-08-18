import { notFound } from "next/navigation";

import { ClientTabsNav, type ClientTabKey } from "./client-tabs-nav";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getClient } from "@/services/clients-repository";

import { VisaoGeralTab } from "./tabs/visao-geral";
import { SegmentosTab } from "./tabs/segmentos";
import { EquipamentosTab } from "./tabs/equipamentos";
import { ServicosTab } from "./tabs/servicos";
import { RestricoesTab } from "./tabs/restricoes";
import { MarcasTab } from "./tabs/marcas";
import { RegioesTab } from "./tabs/regioes";
import { LandingPagesTab } from "./tabs/landing-pages";
import { ConversoesTab } from "./tabs/conversoes";
import { HistoricoTab } from "./tabs/historico";
import { EmBreveTab } from "./tabs/em-breve";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = (tab ?? "visao-geral") as ClientTabKey;

  const supabase = await createClient();
  const client = await getClient(supabase, id);
  if (!client) notFound();

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{client.tradeName || client.name}</h1>
        <ClientStatusBadge status={client.status} />
      </div>
      {client.tradeName && <p className="mb-6 text-sm text-muted-foreground">{client.name}</p>}
      {!client.tradeName && <div className="mb-6" />}

      <ClientTabsNav clientId={id} active={activeTab} />

      {activeTab === "visao-geral" && <VisaoGeralTab client={client} />}
      {activeTab === "segmentos" && <SegmentosTab clientId={id} organizationId={client.organizationId} />}
      {activeTab === "equipamentos" && <EquipamentosTab clientId={id} organizationId={client.organizationId} />}
      {activeTab === "servicos" && <ServicosTab clientId={id} organizationId={client.organizationId} />}
      {activeTab === "restricoes" && <RestricoesTab clientId={id} organizationId={client.organizationId} />}
      {activeTab === "marcas" && <MarcasTab client={client} />}
      {activeTab === "regioes" && <RegioesTab clientId={id} />}
      {activeTab === "landing-pages" && <LandingPagesTab clientId={id} organizationId={client.organizationId} />}
      {activeTab === "conversoes" && <ConversoesTab clientId={id} />}
      {activeTab === "campanhas" && <EmBreveTab label="Campanhas" phase="Motor de campanhas e estrategista chegam na Fase 2." />}
      {activeTab === "leads" && <EmBreveTab label="Leads" phase="Rastreamento de leads chega junto da Fase 6 (Performance)." />}
      {activeTab === "performance" && <EmBreveTab label="Performance" phase="Relatórios de performance chegam na Fase 6." />}
      {activeTab === "aprendizados" && <EmBreveTab label="Aprendizados" phase="Base de aprendizados por cliente chega na Fase 5." />}
      {activeTab === "historico" && <HistoricoTab clientId={id} />}
    </div>
  );
}
