"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelAppointmentAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StaffAppointmentDetails } from "@/services/booking/appointment-repository";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

export function AgendaRow({ appointment }: { appointment: StaffAppointmentDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelAppointmentAction({ appointmentId: appointment.id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento cancelado.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-3">
        <div>
          <p className="font-medium">
            {new Date(appointment.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — {appointment.serviceName}
          </p>
          <p className="text-sm text-muted-foreground">
            {appointment.clientName} com {appointment.professionalName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>{STATUS_LABEL[appointment.status]}</Badge>
          {appointment.status === "confirmed" && (
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
