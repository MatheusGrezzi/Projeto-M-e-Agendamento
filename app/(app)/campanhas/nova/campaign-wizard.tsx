"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { generateCampaignStrategyAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignObjective, Segment } from "@/types";
import type { WizardClientData } from "@/services/campaigns-repository";

const STEPS = ["Cliente", "Segmento", "Equipamentos", "Serviços", "Regiões", "Conversões", "Orçamento", "Objetivo", "Landing Pages", "Revisão"] as const;

const OBJECTIVE_OPTIONS: { value: CampaignObjective; label: string; conversionType: string | null }[] = [
  { value: "leads", label: "Leads", conversionType: null },
  { value: "whatsapp", label: "WhatsApp", conversionType: "whatsapp" },
  { value: "calls", label: "Ligações", conversionType: "call" },
  { value: "forms", label: "Formulários", conversionType: "form" },
  { value: "bookings", label: "Agendamentos", conversionType: "booking" },
];

const MONTHLY_FACTOR = 30.4;

export function CampaignWizard({ segments, clients }: { segments: Segment[]; clients: WizardClientData[] }) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitErrors, setSubmitErrors] = useState<string[] | null>(null);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [equipmentIds, setEquipmentIds] = useState<Set<string>>(new Set());
  const [serviceIds, setServiceIds] = useState<Set<string>>(new Set());
  const [locationIds, setLocationIds] = useState<Set<string>>(new Set());
  const [conversionIds, setConversionIds] = useState<Set<string>>(new Set());
  const [landingPageIds, setLandingPageIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("leads");
  const [notes, setNotes] = useState("");

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const client = clients.find((c) => c.id === clientId) ?? null;
  const clientSegments = useMemo(() => (client ? segments.filter((s) => client.segmentIds.includes(s.id)) : []), [client, segments]);
  const availableEquipment = useMemo(() => (client ? client.equipment.filter((e) => e.segmentId === segmentId) : []), [client, segmentId]);
  const availableServices = useMemo(() => (client ? client.serviceOfferings.filter((o) => equipmentIds.has(o.equipmentId)) : []), [client, equipmentIds]);
  const servedLocations = useMemo(() => client?.locations.filter((l) => l.isServed) ?? [], [client]);
  const excludedLocations = useMemo(() => client?.locations.filter((l) => !l.isServed) ?? [], [client]);
  const selectedCities = useMemo(() => servedLocations.filter((l) => locationIds.has(l.id)).map((l) => l.city), [servedLocations, locationIds]);
  const selectedServices = useMemo(() => availableServices.filter((s) => serviceIds.has(s.id)), [availableServices, serviceIds]);

  const relevantLandingPages = useMemo(() => {
    if (!client) return [];
    return [...client.landingPages].sort((a, b) => {
      const relevance = (lp: (typeof client.landingPages)[number]) => {
        const matchesService = selectedServices.some((s) => s.equipmentId === lp.equipmentId && s.serviceId === lp.serviceId);
        const matchesCity = lp.city ? selectedCities.includes(lp.city) : false;
        return (matchesService ? 2 : 0) + (matchesCity ? 1 : 0);
      };
      return relevance(b) - relevance(a);
    });
  }, [client, selectedServices, selectedCities]);

  const missingLandingPageFor = useMemo(
    () => selectedServices.filter((s) => !relevantLandingPages.some((lp) => lp.equipmentId === s.equipmentId && lp.serviceId === s.serviceId && landingPageIds.has(lp.id))),
    [selectedServices, relevantLandingPages, landingPageIds]
  );

  const selectedObjectiveOption = OBJECTIVE_OPTIONS.find((o) => o.value === objective);
  const objectiveHasMatchingConversion =
    !selectedObjectiveOption?.conversionType || client?.conversions.some((c) => conversionIds.has(c.id) && c.conversionType === selectedObjectiveOption.conversionType);

  function selectClient(id: string) {
    setClientId(id);
    const c = clients.find((cl) => cl.id === id);
    setName(c ? `Campanha ${c.displayName}` : "");
    setDailyBudget(c?.dailyBudget != null ? String(c.dailyBudget) : "");
    setSegmentId("");
    setEquipmentIds(new Set());
    setServiceIds(new Set());
    setLocationIds(new Set());
    setConversionIds(new Set());
    setLandingPageIds(new Set());
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  const canAdvance = [
    Boolean(clientId),
    Boolean(segmentId),
    equipmentIds.size > 0,
    serviceIds.size > 0,
    locationIds.size > 0,
    true, // conversões são opcionais (com warning)
    Number(dailyBudget) > 0,
    Boolean(objective),
    true, // landing pages são opcionais (com warning)
    true,
  ];

  function submit() {
    if (!client) return;
    setSubmitErrors(null);
    setDraftCampaignId(null);
    startTransition(async () => {
      const result = await generateCampaignStrategyAction({
        clientId: client.id,
        name,
        segmentId,
        equipmentIds: Array.from(equipmentIds),
        clientServiceIds: Array.from(serviceIds),
        clientLocationIds: Array.from(locationIds),
        conversionIds: Array.from(conversionIds),
        landingPageIds: Array.from(landingPageIds),
        dailyBudget: Number(dailyBudget),
        objective,
        notes: notes.trim() || null,
      });
      if (result?.error) {
        toast.error(result.error);
        if (result.errors) setSubmitErrors(result.errors);
        if (result.campaignId) setDraftCampaignId(result.campaignId);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((label, i) => (
          <Badge key={label} variant={i === step ? "default" : i < step ? "secondary" : "outline"} className="gap-1">
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Passo {step + 1} de {STEPS.length} — {STEPS[step]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-3">
              <CardDescription>Selecione um cliente ativo.</CardDescription>
              {activeClients.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente ativo cadastrado.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {activeClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      clientId === c.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
                    )}
                  >
                    {c.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && client && (
            <div className="space-y-3">
              <CardDescription>Somente os segmentos que {client.displayName} atende.</CardDescription>
              {clientSegments.length === 0 && (
                <p className="text-sm text-muted-foreground">Este cliente não tem segmentos configurados. Configure na página do cliente antes de continuar.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {clientSegments.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSegmentId(s.id);
                      setEquipmentIds(new Set());
                      setServiceIds(new Set());
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      segmentId === s.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <CardDescription>Equipamentos que {client?.displayName} atende neste segmento (equipamentos excluídos não aparecem aqui).</CardDescription>
              {availableEquipment.length === 0 && <p className="text-sm text-muted-foreground">Nenhum equipamento neste segmento.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {availableEquipment.map((e) => (
                  <label key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={equipmentIds.has(e.id)} onCheckedChange={() => toggle(equipmentIds, setEquipmentIds, e.id)} />
                    <Label className="font-normal">{e.name}</Label>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <CardDescription>Combinações equipamento + serviço que este cliente realmente realiza.</CardDescription>
              {availableServices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço cadastrado para os equipamentos selecionados — volte e escolha outro equipamento, ou cadastre serviços na página do cliente.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {availableServices.map((o) => (
                  <label key={o.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={serviceIds.has(o.id)} onCheckedChange={() => toggle(serviceIds, setServiceIds, o.id)} />
                    <Label className="font-normal">
                      {o.serviceName} — {o.equipmentName}
                    </Label>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <CardDescription className="mb-2">Regiões atendidas — selecione uma ou mais.</CardDescription>
                {servedLocations.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma região atendida cadastrada.</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {servedLocations.map((l) => (
                    <label key={l.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                      <Checkbox checked={locationIds.has(l.id)} onCheckedChange={() => toggle(locationIds, setLocationIds, l.id)} />
                      <Label className="flex-1 font-normal">
                        {l.city}/{l.state}
                      </Label>
                      {l.priority && (
                        <Badge variant="outline" className="text-xs">
                          {l.priority.replace("_", " ")}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              {excludedLocations.length > 0 && (
                <div>
                  <CardDescription className="mb-2 flex items-center gap-1.5">
                    <Ban className="size-3.5" />
                    Regiões não atendidas (restrição do cliente — não podem ser selecionadas)
                  </CardDescription>
                  <div className="flex flex-wrap gap-1.5">
                    {excludedLocations.map((l) => (
                      <Badge key={l.id} variant="destructive">
                        {l.city}/{l.state}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <CardDescription>Conversões cadastradas deste cliente — selecione quais serão usadas por esta campanha.</CardDescription>
              {(client?.conversions.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Este cliente não tem conversões cadastradas ainda.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {client?.conversions.map((cv) => (
                  <label key={cv.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={conversionIds.has(cv.id)} onCheckedChange={() => toggle(conversionIds, setConversionIds, cv.id)} />
                    <Label className="font-normal">
                      {cv.name} {cv.isPrimary && <span className="text-xs text-muted-foreground">(primária)</span>}
                    </Label>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-budget">Orçamento diário (Google Ads)</Label>
                <Input id="campaign-budget" type="number" min={0} step="0.01" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
              </div>
              <p className="text-sm text-muted-foreground">
                Estimativa mensal: <span className="font-medium text-foreground">{formatCurrencyBRL(Number(dailyBudget || 0) * MONTHLY_FACTOR)}</span>
              </p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <CardDescription>O que a campanha deve gerar.</CardDescription>
              <Select value={objective} onValueChange={(v) => setObjective(v as CampaignObjective)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!objectiveHasMatchingConversion && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />O cliente não possui (ou você não selecionou) uma conversão de {selectedObjectiveOption?.label.toLowerCase()}.
                </p>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3">
              <CardDescription>Landing pages relevantes para os equipamentos, serviços e cidades escolhidos. Nunca inventamos uma URL — apenas o que está cadastrado.</CardDescription>
              {(client?.landingPages.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Este cliente não tem landing pages cadastradas.</p>}
              <div className="space-y-2">
                {relevantLandingPages.map((lp) => (
                  <label key={lp.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={landingPageIds.has(lp.id)} onCheckedChange={() => toggle(landingPageIds, setLandingPageIds, lp.id)} />
                    <Label className="flex-1 font-normal">
                      {lp.name} <span className="text-xs text-muted-foreground">({lp.url})</span>
                    </Label>
                  </label>
                ))}
              </div>
              {missingLandingPageFor.length > 0 && (
                <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="size-4 shrink-0" />
                  Sem landing page selecionada para: {missingLandingPageFor.map((s) => `${s.serviceName} de ${s.equipmentName}`).join(", ")}.
                </p>
              )}
            </div>
          )}

          {step === 9 && client && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-name">Nome da campanha</Label>
                  <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campaign-notes">Observações (opcional)</Label>
                <Textarea id="campaign-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <ReviewRow label="Cliente" value={client.displayName} />
                <ReviewRow label="Segmento" value={clientSegments.find((s) => s.id === segmentId)?.label ?? "—"} />
                <ReviewRow label="Equipamentos" value={availableEquipment.filter((e) => equipmentIds.has(e.id)).map((e) => e.name).join(", ") || "—"} />
                <ReviewRow label="Serviços" value={selectedServices.map((s) => `${s.serviceName} (${s.equipmentName})`).join(", ") || "—"} />
                <ReviewRow label="Regiões" value={selectedCities.join(", ") || "—"} />
                <ReviewRow label="Regiões proibidas" value={excludedLocations.map((l) => `${l.city}/${l.state}`).join(", ") || "Nenhuma"} />
                <ReviewRow label="Conversões" value={client.conversions.filter((c) => conversionIds.has(c.id)).map((c) => c.name).join(", ") || "Nenhuma selecionada"} />
                <ReviewRow
                  label="Orçamento"
                  value={`${formatCurrencyBRL(Number(dailyBudget || 0))}/dia · ≈ ${formatCurrencyBRL(Number(dailyBudget || 0) * MONTHLY_FACTOR)}/mês`}
                />
                <ReviewRow label="Landing pages" value={client.landingPages.filter((lp) => landingPageIds.has(lp.id)).map((lp) => lp.name).join(", ") || "Nenhuma selecionada"} />
                <ReviewRow
                  label="Restrições do cliente"
                  value={[...client.excludedEquipmentLabels, ...client.excludedServiceLabels].join(", ") || "Nenhuma cadastrada"}
                />
                <ReviewRow label="Marcas não atendidas" value={client.brandPolicy === "specific" ? client.excludedBrandNames.join(", ") || "Nenhuma" : "Sem restrição de marca"} />
                <ReviewRow label="Observações" value={notes || "—"} />
              </div>

              {submitErrors && submitErrors.length > 0 && (
                <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">Não foi possível gerar a estratégia:</p>
                  <ul className="ml-5 list-disc space-y-1 text-sm text-destructive/90">
                    {submitErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                  {draftCampaignId && (
                    <p className="text-sm">
                      O rascunho foi salvo —{" "}
                      <Link href={`/campanhas/${draftCampaignId}`} className="font-medium underline">
                        ajuste os dados do cliente e tente novamente
                      </Link>
                      .
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!canAdvance[step]} onClick={() => setStep((s) => s + 1)}>
            Próximo
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={isPending}>
            <Sparkles className="size-4" />
            {isPending ? "Gerando..." : "Gerar estratégia"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="col-span-2 text-foreground">{value}</span>
    </div>
  );
}
