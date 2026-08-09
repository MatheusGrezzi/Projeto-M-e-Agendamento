"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelAppointmentAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AppointmentWithDetails } from "@/services/booking/appointment-repository";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  cancelled: "secondary",
  completed: "outline",
  no_show: "destructive",
};

export function AppointmentCard({ appointment, now }: { appointment: AppointmentWithDetails; now: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const startsAt = new Date(appointment.startsAt);
  // `now` comes from the server component that rendered this list — Date.now()
  // is impure, so the client never calls it directly during render.
  const canCancel = appointment.status === "confirmed" && startsAt.getTime() > now;

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
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{appointment.serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {appointment.professionalName} · {startsAt.toLocaleDateString("pt-BR")} às{" "}
            {startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[appointment.status]}>{STATUS_LABEL[appointment.status]}</Badge>
          {canCancel && (
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Cancelando..." : "Cancelar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
