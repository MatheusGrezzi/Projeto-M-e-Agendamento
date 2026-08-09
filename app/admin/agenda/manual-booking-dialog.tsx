"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createManualAppointmentAction, getAvailableSlotsAction, getProfessionalsForServiceAction, searchClientsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailableSlot } from "@/services/booking/availability-repository";
import type { Professional, Profile, Service } from "@/types";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualBookingDialog({ services }: { services: Service[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [clientQuery, setClientQuery] = useState("");
  const [clients, setClients] = useState<Profile[]>([]);
  const [clientId, setClientId] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(todayDateString());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setClientQuery("");
    setClients([]);
    setClientId("");
    setServiceId("");
    setProfessionals([]);
    setProfessionalId("");
    setDate(todayDateString());
    setSlots([]);
    setStartTime("");
    setError(null);
  }

  function handleClientSearch(value: string) {
    setClientQuery(value);
    setClientId("");
    if (value.trim().length < 2) {
      setClients([]);
      return;
    }
    startTransition(async () => {
      const result = await searchClientsAction(value.trim());
      setClients(result.data ?? []);
    });
  }

  function handleServiceChange(value: string | null) {
    if (!value) return;
    setServiceId(value);
    setProfessionalId("");
    setSlots([]);
    setStartTime("");
    startTransition(async () => {
      const result = await getProfessionalsForServiceAction(value);
      setProfessionals(result.data ?? []);
    });
  }

  function fetchSlots(profId: string, dateStr: string) {
    startTransition(async () => {
      const result = await getAvailableSlotsAction({ professionalId: profId, serviceId, date: dateStr });
      setSlots(result.data ?? []);
    });
  }

  function handleProfessionalChange(value: string | null) {
    if (!value) return;
    setProfessionalId(value);
    setStartTime("");
    fetchSlots(value, date);
  }

  function handleDateChange(value: string) {
    setDate(value);
    setStartTime("");
    if (professionalId) fetchSlots(professionalId, value);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createManualAppointmentAction({ professionalId, serviceId, date, startTime, clientId });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento criado.");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Novo agendamento
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input placeholder="Buscar cliente pelo nome" value={clientQuery} onChange={(e) => handleClientSearch(e.target.value)} />
            {clients.length > 0 && !clientId && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-border">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setClientId(client.id);
                      setClientQuery(client.fullName ?? "Cliente");
                      setClients([]);
                    }}
                  >
                    {client.fullName ?? "Cliente sem nome"}
                  </button>
                ))}
              </div>
            )}
            {clientId && <p className="text-xs text-muted-foreground">Cliente selecionado.</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={handleServiceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceId && (
            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <Select value={professionalId} onValueChange={handleProfessionalChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {professionalId && (
            <div className="space-y-1.5">
              <Label htmlFor="manual-date">Data</Label>
              <Input id="manual-date" type="date" min={todayDateString()} value={date} onChange={(e) => handleDateChange(e.target.value)} />
            </div>
          )}

          {professionalId && slots.length > 0 && (
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    type="button"
                    size="sm"
                    variant={startTime === slot.startTime ? "default" : "outline"}
                    onClick={() => setStartTime(slot.startTime)}
                  >
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {professionalId && slots.length === 0 && <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || !clientId || !startTime}>
            {isPending ? "Criando..." : "Criar agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
