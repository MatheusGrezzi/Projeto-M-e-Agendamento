"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { CampaignObjective, Segment } from "@/types";
import type { WizardClientData } from "@/services/campaigns-repository";

const STEPS = ["Cliente", "Segmento", "Equipamento", "Serviços", "Regiões", "Orçamento", "Objetivo", "Revisão"] as const;

const OBJECTIVE_OPTIONS: { value: CampaignObjective; label: string }[] = [
  { value: "leads", label: "Leads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "calls", label: "Ligações" },
  { value: "forms", label: "Formulários" },
  { value: "bookings", label: "Agendamentos" },
];

export function CampaignWizard({ segments, clients }: { segments: Segment[]; clients: WizardClientData[] }) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [clientId, setClientId] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [equipmentIds, setEquipmentIds] = useState<Set<string>>(new Set());
  const [serviceIds, setServiceIds] = useState<Set<string>>(new Set());
  const [locationIds, setLocationIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("leads");
  const [notes, setNotes] = useState("");

  const client = clients.find((c) => c.id === clientId) ?? null;
  const clientSegments = useMemo(
    () => (client ? segments.filter((s) => client.segmentIds.includes(s.id)) : []),
    [client, segments]
  );
  const availableEquipment = useMemo(
    () => (client ? client.equipment.filter((e) => e.segmentId === segmentId) : []),
    [client, segmentId]
  );
  const availableServices = useMemo(
    () => (client ? client.serviceOfferings.filter((o) => equipmentIds.has(o.equipmentId)) : []),
    [client, equipmentIds]
  );

  function selectClient(id: string) {
    setClientId(id);
    const c = clients.find((cl) => cl.id === id);
    setName(c ? `Campanha ${c.displayName}` : "");
    setDailyBudget(c?.dailyBudget != null ? String(c.dailyBudget) : "");
    setSegmentId("");
    setEquipmentIds(new Set());
    setServiceIds(new Set());
    setLocationIds(new Set());
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
    Number(dailyBudget) > 0,
    Boolean(objective),
    true,
  ];

  function submit() {
    if (!client) return;
    startTransition(async () => {
      const result = await generateCampaignStrategyAction({
        clientId: client.id,
        name,
        segmentId,
        equipmentIds: Array.from(equipmentIds),
        clientServiceIds: Array.from(serviceIds),
        clientLocationIds: Array.from(locationIds),
        dailyBudget: Number(dailyBudget),
        objective,
        notes: notes.trim() || null,
      });
      if (result?.error) toast.error(result.error);
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
              <CardDescription>Selecione o cliente para o qual a campanha será criada.</CardDescription>
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda — cadastre um em Clientes.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {clients.map((c) => (
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
                <p className="text-sm text-muted-foreground">
                  Este cliente não tem segmentos configurados. Configure na página do cliente antes de continuar.
                </p>
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
              <CardDescription>Equipamentos que {client?.displayName} atende neste segmento.</CardDescription>
              {availableEquipment.length === 0 && <p className="text-sm text-muted-foreground">Nenhum equipamento neste segmento.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {availableEquipment.map((e) => (
                  <label key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox
                      checked={equipmentIds.has(e.id)}
                      onCheckedChange={() => toggle(equipmentIds, setEquipmentIds, e.id)}
                    />
                    <Label className="font-normal">{e.name}</Label>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <CardDescription>Somente serviços que este cliente realmente realiza para os equipamentos escolhidos.</CardDescription>
              {availableServices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço cadastrado para os equipamentos selecionados — volte e escolha outro equipamento, ou cadastre serviços
                  na página do cliente.
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
            <div className="space-y-3">
              <CardDescription>Somente regiões válidas cadastradas para este cliente.</CardDescription>
              {(client?.locations.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma região atendida cadastrada para este cliente.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {client?.locations.map((l) => (
                  <label key={l.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={locationIds.has(l.id)} onCheckedChange={() => toggle(locationIds, setLocationIds, l.id)} />
                    <Label className="font-normal">
                      {l.city}/{l.state}
                    </Label>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-name">Nome da campanha</Label>
                <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campaign-budget">Orçamento diário (Google Ads)</Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 6 && (
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
            </div>
          )}

          {step === 7 && client && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="campaign-notes">Observações (opcional)</Label>
                <Textarea id="campaign-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">{name}</p>
                <p className="mt-1 text-muted-foreground">
                  {client.displayName} · {clientSegments.find((s) => s.id === segmentId)?.label} · {equipmentIds.size} equipamento(s) ·{" "}
                  {serviceIds.size} serviço(s) · {locationIds.size} região(ões) · R$ {Number(dailyBudget || 0).toFixed(2)}/dia ·{" "}
                  {OBJECTIVE_OPTIONS.find((o) => o.value === objective)?.label}
                </p>
              </div>
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
