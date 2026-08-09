"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";

import { createProfessionalAction, getProfessionalDetailsAction, updateProfessionalAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { weekdayName } from "@/lib/format";
import { professionalSchema } from "@/lib/validations/professional";
import type { Professional, Service } from "@/types";

type ProfessionalFormValues = z.input<typeof professionalSchema>;

interface WorkingHoursDraft {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function emptyWorkingHours(): WorkingHoursDraft[] {
  return Array.from({ length: 7 }, () => ({ enabled: false, startTime: "09:00", endTime: "18:00" }));
}

export function ProfessionalDialog({ professional, services }: { professional?: Professional; services: Service[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(professional);

  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHoursDraft[]>(emptyWorkingHours());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: professional
      ? {
          fullName: professional.fullName,
          bio: professional.bio ?? "",
          photoUrl: professional.photoUrl ?? "",
          active: professional.active,
          displayOrder: professional.displayOrder,
          serviceIds: [],
        }
      : { fullName: "", bio: "", photoUrl: "", active: true, displayOrder: 0, serviceIds: [] },
  });

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;

    reset();
    setServiceIds([]);
    setWorkingHours(emptyWorkingHours());

    if (professional) {
      setLoading(true);
      const result = await getProfessionalDetailsAction(professional.id);
      setLoading(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setServiceIds(result.data?.serviceIds ?? []);
      const hours = emptyWorkingHours();
      for (const entry of result.data?.workingHours ?? []) {
        hours[entry.weekday] = { enabled: true, startTime: entry.startTime, endTime: entry.endTime };
      }
      setWorkingHours(hours);
    }
  }

  function toggleService(serviceId: string, checked: boolean) {
    setServiceIds((prev) => (checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)));
  }

  async function onSubmit(values: ProfessionalFormValues) {
    const payload = {
      professional: { ...values, serviceIds },
      workingHours: workingHours
        .map((entry, weekday) => ({ ...entry, weekday }))
        .filter((entry) => entry.enabled)
        .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })),
    };

    const result = isEdit ? await updateProfessionalAction(professional!.id, payload) : await createProfessionalAction(payload);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Profissional atualizado." : "Profissional criado.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={isEdit ? <Button variant="ghost" size="icon" /> : <Button />}>
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" />
            Novo profissional
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar profissional" : "Novo profissional"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome</Label>
              <Input id="fullName" placeholder="Nome completo" {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio (opcional)</Label>
              <Textarea id="bio" {...register("bio")} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={watch("active")} onCheckedChange={(checked) => setValue("active", checked === true)} />
              <Label htmlFor="active">Ativo (visível no site)</Label>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Serviços realizados</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={serviceIds.includes(service.id)}
                        onCheckedChange={(checked) => toggleService(service.id, checked === true)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm font-normal">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Horário de trabalho</Label>
              <div className="space-y-1.5">
                {workingHours.map((entry, weekday) => (
                  <div key={weekday} className="flex items-center gap-2">
                    <Checkbox
                      checked={entry.enabled}
                      onCheckedChange={(checked) =>
                        setWorkingHours((prev) => prev.map((e, i) => (i === weekday ? { ...e, enabled: checked === true } : e)))
                      }
                    />
                    <span className="w-20 shrink-0 text-sm">{weekdayName(weekday)}</span>
                    {entry.enabled && (
                      <>
                        <Input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) =>
                            setWorkingHours((prev) => prev.map((w, i) => (i === weekday ? { ...w, startTime: e.target.value } : w)))
                          }
                          className="h-8 w-28"
                        />
                        <span className="text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) =>
                            setWorkingHours((prev) => prev.map((w, i) => (i === weekday ? { ...w, endTime: e.target.value } : w)))
                          }
                          className="h-8 w-28"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
