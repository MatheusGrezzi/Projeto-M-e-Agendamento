import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegenerateButton } from "./regenerate-button";
import { CampaignStatusBadge } from "@/components/shared/campaign-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getCampaign, getCampaignAdGroups, getCampaignNegatives, getLatestCampaignVersion } from "@/services/campaigns-repository";
import { getClient } from "@/services/clients-repository";
import type { KeywordMatchType } from "@/types";

const OBJECTIVE_LABEL = { leads: "Leads", whatsapp: "WhatsApp", calls: "Ligações", forms: "Formulários", bookings: "Agendamentos" } as const;

const MATCH_TYPE_LABEL: Record<KeywordMatchType, string> = { broad: "Ampla", phrase: "Frase", exact: "Exata" };

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const campaign = await getCampaign(supabase, id);
  if (!campaign) notFound();

  const [client, version] = await Promise.all([getClient(supabase, campaign.clientId), getLatestCampaignVersion(supabase, id)]);
  const [adGroups, negatives] = version
    ? await Promise.all([getCampaignAdGroups(supabase, version.id), getCampaignNegatives(supabase, version.id)])
    : [[], []];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{campaign.name}</h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client && (
              <Link href={`/clientes/${client.id}`} className="hover:underline">
                {client.tradeName || client.name}
              </Link>
            )}
            {" · "}
            {OBJECTIVE_LABEL[campaign.objective]} · {formatCurrencyBRL(campaign.dailyBudget)}/dia
            {version && ` · versão ${version.versionNumber}`}
          </p>
        </div>
        <RegenerateButton campaignId={id} />
      </div>

      {!version ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhuma estratégia gerada ainda.</CardContent>
        </Card>
      ) : (
        <>
          {version.warnings.length > 0 && (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="size-4" />
                Alertas do Estrategista
              </p>
              <ul className="ml-6 list-disc space-y-1 text-sm text-destructive/90">
                {version.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {version.reasoningSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo do raciocínio</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{version.reasoningSummary}</CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {adGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <CardTitle className="text-sm">{group.name}</CardTitle>
                  {group.landingPageUrl ? (
                    <a
                      href={group.landingPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Landing page <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Sem landing page
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Palavras-chave</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.keywords.map((k, i) => (
                        <Badge key={i} variant="secondary">
                          {k.keyword} <span className="ml-1 text-muted-foreground">({MATCH_TYPE_LABEL[k.match_type]})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Títulos</p>
                    <ul className="space-y-1 text-sm text-foreground">
                      {group.headlines.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Descrições</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {group.descriptions.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Palavras negativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {negatives.map((n, i) => (
                  <Badge key={i} variant="outline">
                    {n.keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">Auditoria e aprovação humana chegam na Fase 3.</p>
        </>
      )}
    </div>
  );
}
