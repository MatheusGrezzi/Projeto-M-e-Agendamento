"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  addClientExcludedEquipmentAction,
  addClientExcludedServiceAction,
  removeClientExcludedEquipmentAction,
  removeClientExcludedServiceAction,
} from "../actions";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientExcludedEquipmentSchema, clientExcludedServiceSchema } from "@/lib/validations/client-relations";
import type { ClientExcludedEquipment, ClientExcludedService, Equipment, ServiceType } from "@/types";

function AddExcludedEquipmentDialog({ clientId, equipment }: { clientId: string; equipment: Equipment[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientExcludedEquipmentSchema>;
  const {
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientExcludedEquipmentSchema, undefined, { raw: true }),
    defaultValues: { equipmentId: "", label: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await addClientExcludedEquipmentAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Restrição adicionada.");
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
        Equipamento não atendido
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Equipamento não atendido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Equipamento do catálogo (opcional)</Label>
            <Select value={watch("equipmentId") || ""} onValueChange={(v) => setValue("equipmentId", v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excluded-equipment-label">Ou descreva (ex: Geladeira comercial)</Label>
            <Input id="excluded-equipment-label" {...register("label")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excluded-equipment-notes">Observações</Label>
            <Input id="excluded-equipment-notes" {...register("notes")} />
          </div>
          {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddExcludedServiceDialog({ clientId, equipment, serviceTypes }: { clientId: string; equipment: Equipment[]; serviceTypes: ServiceType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientExcludedServiceSchema>;
  const {
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientExcludedServiceSchema, undefined, { raw: true }),
    defaultValues: { equipmentId: "", serviceId: "", label: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await addClientExcludedServiceAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Restrição adicionada.");
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
        Serviço não realizado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Serviço não realizado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Equipamento (opcional)</Label>
              <Select value={watch("equipmentId") || ""} onValueChange={(v) => setValue("equipmentId", v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Serviço (opcional)</Label>
              <Select value={watch("serviceId") || ""} onValueChange={(v) => setValue("serviceId", v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excluded-service-label">Ou descreva (ex: Venda de peças)</Label>
            <Input id="excluded-service-label" {...register("label")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excluded-service-notes">Observações</Label>
            <Input id="excluded-service-notes" {...register("notes")} />
          </div>
          {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RestricoesForm({
  clientId,
  equipment,
  serviceTypes,
  excludedEquipment,
  excludedServices,
}: {
  clientId: string;
  equipment: Equipment[];
  serviceTypes: ServiceType[];
  excludedEquipment: ClientExcludedEquipment[];
  excludedServices: ClientExcludedService[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          Essas informações são usadas pelos agentes de IA para nunca anunciar algo que este cliente não realiza. Mantenha sempre
          atualizado.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Equipamentos não atendidos</CardTitle>
            <CardDescription>O que este cliente explicitamente não conserta.</CardDescription>
          </div>
          <AddExcludedEquipmentDialog clientId={clientId} equipment={equipment} />
        </CardHeader>
        <CardContent>
          {excludedEquipment.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma restrição cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {excludedEquipment.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.equipmentName ?? row.label}</TableCell>
                    <TableCell className="text-muted-foreground">{row.notes || "—"}</TableCell>
                    <TableCell>
                      <DeleteIconButton action={() => removeClientExcludedEquipmentAction(clientId, row.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Serviços não realizados</CardTitle>
            <CardDescription>O que este cliente explicitamente não oferece.</CardDescription>
          </div>
          <AddExcludedServiceDialog clientId={clientId} equipment={equipment} serviceTypes={serviceTypes} />
        </CardHeader>
        <CardContent>
          {excludedServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma restrição cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {excludedServices.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.equipmentName ?? "Qualquer"}</TableCell>
                    <TableCell>{row.serviceName ?? "Qualquer"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.label || row.notes || "—"}</TableCell>
                    <TableCell>
                      <DeleteIconButton action={() => removeClientExcludedServiceAction(clientId, row.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
