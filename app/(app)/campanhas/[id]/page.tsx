import { AlertTriangle, Lightbulb, MapPin, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegenerateButton } from "./regenerate-button";
import { VersionSelector } from "./version-selector";
import { JsonToggle } from "./json-toggle";
import { AuditButton } from "./audit-button";
import { AuditReportCard } from "./audit-report";
import { ApproveButton } from "./approve-button";
import { CampaignStatusBadge } from "@/components/shared/campaign-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrencyBRL, formatDateTimeBr } from "@/lib/format";
import { hasCriticalIssue } from "@/lib/schemas/campaign-audit";
import { createClient } from "@/lib/supabase/server";
import {
  getCampaign,
  getCampaignAdGroups,
  getCampaignAssets,
  getCampaignNegatives,
  getCampaignVersion,
  listCampaignVersions,
} from "@/services/campaigns-repository";
import { getLatestCampaignAudit, listCampaignApprovals } from "@/services/campaign-audits-repository";
import { getClient } from "@/services/clients-repository";

const OBJECTIVE_LABEL = { leads: "Leads", whatsapp: "WhatsApp", calls: "Ligações", forms: "Formulários", bookings: "Agendamentos" } as const;

const MATCH_TYPE_LABEL: Record<string, string> = { exact: "Exata", phrase: "Frase", broad: "Ampla" };

const NEGATIVE_CATEGORY_LABEL: Record<string, string> = {
  parts: "Peças",
  diy: "Faça você mesmo",
  employment: "Emprego",
  training: "Curso/treinamento",
  manuals: "Manuais",
  irrelevant_equipment: "Equipamento não atendido",
  excluded_service: "Serviço não realizado",
  excluded_location: "Região excluída",
  other: "Outro",
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: versionParam } = await searchParams;
  const supabase = await createClient();

  const campaign = await getCampaign(supabase, id);
  if (!campaign) notFound();

  const [client, versions] = await Promise.all([getClient(supabase, campaign.clientId), listCampaignVersions(supabase, id)]);

  const selectedVersion = versionParam
    ? (versions.find((v) => v.versionNumber === Number(versionParam)) ?? versions[0])
    : versions[0];

  const version = selectedVersion ? await getCampaignVersion(supabase, selectedVersion.id) : null;
  const [adGroups, negatives, assets, audit, approvals] = version
    ? await Promise.all([
        getCampaignAdGroups(supabase, version.id),
        getCampaignNegatives(supabase, version.id),
        getCampaignAssets(supabase, version.id),
        getLatestCampaignAudit(supabase, version.id),
        listCampaignApprovals(supabase, id),
      ])
    : [[], [], { sitelinks: [], callouts: [], structuredSnippets: [] }, null, []];

  const isLatestVersion = version !== null && versions[0]?.id === version.id;
  const canApprove =
    isLatestVersion &&
    audit !== null &&
    !hasCriticalIssue(audit.report.issues) &&
    audit.status !== "rejected" &&
    campaign.status === "awaiting_human_approval";

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
          </p>
        </div>
        <div className="flex items-center gap-2">
          {version && <VersionSelector campaignId={id} versions={versions} currentVersionNumber={version.versionNumber} />}
          <RegenerateButton campaignId={id} hasVersion={versions.length > 0} />
        </div>
      </div>

      {!version ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <p>Nenhuma estratégia gerada ainda.</p>
            <p className="text-xs">Clique em &quot;Gerar estratégia&quot; para criar a primeira versão.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo</CardTitle>
              <CardDescription>Versão {version.versionNumber} · gerada por {version.generatedBy}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground">{version.strategy.strategy_summary}</CardContent>
          </Card>

          {version.generationReason && (
            <p className="text-xs text-muted-foreground">
              <MessageSquareText className="mr-1 inline size-3" />
              Motivo da regeneração: {version.generationReason}
            </p>
          )}

          {version.strategy.warnings.length > 0 && (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="size-4" />
                Warnings
              </p>
              <ul className="ml-6 list-disc space-y-1 text-sm text-destructive/90">
                {version.strategy.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {version.strategy.assumptions.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lightbulb className="size-4" />
                Assumptions (hipóteses do agente)
              </p>
              <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                {version.strategy.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Objetivo</p>
                <p className="text-foreground">{OBJECTIVE_LABEL[version.strategy.campaign.objective]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orçamento diário</p>
                <p className="text-foreground">{formatCurrencyBRL(version.strategy.campaign.daily_budget)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estratégia de lance</p>
                <p className="text-foreground">{version.strategy.bidding.strategy}</p>
                <p className="text-xs text-muted-foreground">{version.strategy.bidding.reason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Idioma</p>
                <p className="text-foreground">{version.strategy.campaign.language}</p>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="size-4" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {version.strategy.locations.included.map((l) => (
                  <Badge key={l} variant="secondary">
                    {l}
                  </Badge>
                ))}
              </div>
              {version.strategy.locations.excluded.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {version.strategy.locations.excluded.map((l) => (
                    <Badge key={l} variant="destructive">
                      Excluída: {l}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversões */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversões</CardTitle>
            </CardHeader>
            <CardContent>
              {version.strategy.conversions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conversão utilizada nesta estratégia.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {version.strategy.conversions.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grupos de anúncios / Palavras-chave / Anúncios */}
          <div className="space-y-4">
            {adGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm">{group.name}</CardTitle>
                    {group.theme && <CardDescription>{group.theme}</CardDescription>}
                  </div>
                  {group.landingPageUrl ? (
                    <a href={group.landingPageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Landing page
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
                        <Badge key={i} variant="secondary" title={k.reason ?? undefined}>
                          {k.text} <span className="ml-1 text-muted-foreground">({MATCH_TYPE_LABEL[k.matchType]})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Anúncios (RSA)</p>
                    <div className="space-y-3">
                      {group.ads.map((ad, i) => (
                        <div key={i} className="rounded-lg border border-border p-3">
                          <ul className="space-y-0.5 text-sm text-foreground">
                            {ad.headlines.map((h, j) => (
                              <li key={j}>{h}</li>
                            ))}
                          </ul>
                          <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                            {ad.descriptions.map((d, j) => (
                              <li key={j}>{d}</li>
                            ))}
                          </ul>
                          {(ad.path1 || ad.path2) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              /{ad.path1}
                              {ad.path2 ? `/${ad.path2}` : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Negativas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Palavras negativas</CardTitle>
              <CardDescription>Específicas deste cliente — nunca uma lista universal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {negatives.map((n, i) => (
                  <Badge key={i} variant="outline" title={n.reason ?? undefined}>
                    {n.text} <span className="ml-1 text-muted-foreground">({NEGATIVE_CATEGORY_LABEL[n.category] ?? n.category})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Sitelinks</p>
                <div className="flex flex-wrap gap-1.5">
                  {assets.sitelinks.map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Callouts</p>
                <div className="flex flex-wrap gap-1.5">
                  {assets.callouts.map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Structured snippets</p>
                <div className="flex flex-wrap gap-1.5">
                  {assets.structuredSnippets.map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <JsonToggle json={version.strategy} />

          {/* Auditoria */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Auditoria</h2>
                <p className="text-xs text-muted-foreground">
                  {isLatestVersion
                    ? "Cada nova versão precisa de uma nova auditoria — a de uma versão anterior não vale para esta."
                    : "Esta não é a versão mais recente — gere ou selecione a versão atual para auditar/aprovar."}
                </p>
              </div>
              {isLatestVersion && <AuditButton campaignId={id} />}
            </div>

            {audit ? (
              <AuditReportCard audit={audit} />
            ) : (
              <p className="text-sm text-muted-foreground">Esta versão ainda não foi auditada.</p>
            )}

            {canApprove && audit && (
              <div className="flex justify-end">
                <ApproveButton campaignId={id} campaignVersionId={version.id} campaignAuditId={audit.id} />
              </div>
            )}

            {approvals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Histórico de aprovação</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {approvals.map((a) => (
                    <li key={a.id}>
                      Aprovada em {formatDateTimeBr(a.approvedAt)}
                      {a.notes && ` — "${a.notes}"`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">Execução (Google Ads, Claude Chrome) e QA chegam em uma fase futura.</p>
        </>
      )}
    </div>
  );
}
