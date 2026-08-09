"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createAppointmentAction, getAvailableSlotsAction, getProfessionalsForServiceAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDurationMinutes, formatPriceCents } from "@/lib/format";
import type { AvailableSlot } from "@/services/booking/availability-repository";
import type { Professional, Service } from "@/types";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWizard({ services, isAuthenticated, initialServiceId }: { services: Service[]; isAuthenticated: boolean; initialServiceId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [serviceId, setServiceId] = useState<string>(initialServiceId ?? "");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [date, setDate] = useState<string>(todayDateString());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);

  function handleServiceChange(value: string | null) {
    if (!value) return;
    setServiceId(value);
    setProfessionalId("");
    setSlots([]);
    setStartTime("");
    setError(null);
    startTransition(async () => {
      const result = await getProfessionalsForServiceAction(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setProfessionals(result.data ?? []);
    });
  }

  function handleProfessionalChange(value: string | null) {
    if (!value) return;
    setProfessionalId(value);
    setSlots([]);
    setStartTime("");
    if (value && date) fetchSlots(value, date);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setStartTime("");
    setSlots([]);
    if (professionalId && value) fetchSlots(professionalId, value);
  }

  function fetchSlots(profId: string, dateStr: string) {
    setError(null);
    startTransition(async () => {
      const result = await getAvailableSlotsAction({ professionalId: profId, serviceId, date: dateStr });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSlots(result.data ?? []);
    });
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await createAppointmentAction({ professionalId, serviceId, date, startTime, notes });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setConfirmed(true);
      toast.success("Agendamento confirmado!");
      router.refresh();
    });
  }

  if (confirmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamento confirmado</CardTitle>
          <CardDescription>Você pode acompanhar seus agendamentos em &quot;Minha conta&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/minha-conta" />}>Ver meus agendamentos</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Escolha o serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={serviceId} onValueChange={handleServiceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um serviço">
                {() => {
                  const s = services.find((service) => service.id === serviceId);
                  return s ? `${s.name} — ${formatDurationMinutes(s.durationMinutes)} — ${formatPriceCents(s.priceCents)}` : "Selecione um serviço";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} — {formatDurationMinutes(service.durationMinutes)} — {formatPriceCents(service.priceCents)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {serviceId && (
        <Card>
          <CardHeader>
            <CardTitle>2. Escolha o profissional</CardTitle>
          </CardHeader>
          <CardContent>
            {professionals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum profissional disponível para este serviço.</p>
            ) : (
              <Select value={professionalId} onValueChange={handleProfessionalChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um profissional">
                    {() => professionals.find((p) => p.id === professionalId)?.fullName ?? "Selecione um profissional"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {professionalId && (
        <Card>
          <CardHeader>
            <CardTitle>3. Escolha a data e o horário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" min={todayDateString()} value={date} onChange={(e) => handleDateChange(e.target.value)} />
            </div>

            {isPending && slots.length === 0 && <p className="text-sm text-muted-foreground">Carregando horários...</p>}

            {!isPending && slots.length === 0 && date && <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>}

            {slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    type="button"
                    variant={startTime === slot.startTime ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStartTime(slot.startTime)}
                  >
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {startTime && (
        <Card>
          <CardHeader>
            <CardTitle>4. Confirmar</CardTitle>
            <CardDescription>
              {selectedService?.name} · {date.split("-").reverse().join("/")} às {startTime}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação para o profissional?" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {isAuthenticated ? (
              <Button onClick={handleConfirm} disabled={isPending} className="w-full">
                {isPending ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-center text-sm">
                <p>Você precisa entrar para confirmar o agendamento.</p>
                <Button render={<Link href="/login?next=/agendar" />} className="w-full">
                  Entrar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
