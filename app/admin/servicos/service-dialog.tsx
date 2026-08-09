"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";

import { createServiceAction, updateServiceAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { serviceSchema } from "@/lib/validations/service";
import type { Service } from "@/types";

type ServiceFormValues = z.input<typeof serviceSchema>;

export function ServiceDialog({ service }: { service?: Service }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? "",
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          active: service.active,
          displayOrder: service.displayOrder,
        }
      : { name: "", description: "", durationMinutes: 30, priceCents: 0, active: true, displayOrder: 0 },
  });

  async function onSubmit(values: ServiceFormValues) {
    const result = isEdit ? await updateServiceAction(service!.id, values) : await createServiceAction(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Serviço atualizado." : "Serviço criado.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger render={isEdit ? <Button variant="ghost" size="icon" /> : <Button />}>
        {isEdit ? <Pencil className="size-4" /> : (
          <>
            <Plus className="size-4" />
            Novo serviço
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: Corte de cabelo" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input id="durationMinutes" type="number" min={1} {...register("durationMinutes")} />
              {errors.durationMinutes && <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceCents">Preço (centavos)</Label>
              <Input id="priceCents" type="number" min={0} {...register("priceCents")} />
              {errors.priceCents && <p className="text-sm text-destructive">{errors.priceCents.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="active" checked={watch("active")} onCheckedChange={(checked) => setValue("active", checked === true)} />
            <Label htmlFor="active">Ativo (visível no site)</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
