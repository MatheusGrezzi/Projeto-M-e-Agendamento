"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createCustomEquipmentAction, setClientEquipmentAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customEquipmentSchema } from "@/lib/validations/catalog";
import type { Equipment, Segment } from "@/types";

function AddEquipmentDialog({ clientId, segments }: { clientId: string; segments: Segment[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof customEquipmentSchema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customEquipmentSchema, undefined, { raw: true }),
    defaultValues: { segmentId: "", name: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createCustomEquipmentAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Equipamento criado.");
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-4" />
        Equipamento personalizado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo equipamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Segmento</Label>
            <Select value={watch("segmentId")} onValueChange={(v) => setValue("segmentId", v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.segmentId && <p className="text-sm text-destructive">{errors.segmentId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipment-name">Nome</Label>
            <Input id="equipment-name" placeholder="Ex: Coifa" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EquipamentosForm({
  clientId,
  segments,
  equipment,
  selectedIds,
}: {
  clientId: string;
  segments: Segment[];
  equipment: Equipment[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await setClientEquipmentAction(clientId, Array.from(selected));
      if (result.error) toast.error(result.error);
      else {
        toast.success("Equipamentos salvos.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm">Equipamentos atendidos</CardTitle>
          <CardDescription>Marque os equipamentos que este cliente atende.</CardDescription>
        </div>
        <AddEquipmentDialog clientId={clientId} segments={segments} />
      </CardHeader>
      <CardContent className="space-y-5">
        {segments.map((segment) => {
          const items = equipment.filter((e) => e.segmentId === segment.id);
          if (items.length === 0) return null;
          return (
            <div key={segment.id}>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{segment.label}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                    <Label className="font-normal">{item.name}</Label>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
