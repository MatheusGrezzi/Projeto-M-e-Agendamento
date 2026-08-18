"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { addClientServiceOfferingAction, removeClientServiceOfferingAction } from "../actions";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientServiceOfferingSchema } from "@/lib/validations/client-relations";
import type { ClientServiceOffering, Equipment, ServiceType } from "@/types";

function AddOfferingDialog({ clientId, equipment, serviceTypes }: { clientId: string; equipment: Equipment[]; serviceTypes: ServiceType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientServiceOfferingSchema>;
  const {
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientServiceOfferingSchema, undefined, { raw: true }),
    defaultValues: { equipmentId: "", serviceId: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await addClientServiceOfferingAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Serviço adicionado.");
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
      <DialogTrigger render={<Button size="sm" disabled={equipment.length === 0} />}>
        <Plus className="size-4" />
        Novo serviço
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Serviço realizado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Equipamento</Label>
            <Select value={watch("equipmentId")} onValueChange={(v) => setValue("equipmentId", v as string)}>
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
            {errors.equipmentId && <p className="text-sm text-destructive">{errors.equipmentId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select value={watch("serviceId")} onValueChange={(v) => setValue("serviceId", v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="offering-notes">Observações</Label>
            <Input id="offering-notes" {...register("notes")} />
          </div>
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

export function ServicosForm({
  clientId,
  equipment,
  serviceTypes,
  offerings,
}: {
  clientId: string;
  equipment: Equipment[];
  serviceTypes: ServiceType[];
  offerings: ClientServiceOffering[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm">Serviços realizados</CardTitle>
          <CardDescription>Combinações de equipamento + serviço que este cliente efetivamente presta.</CardDescription>
        </div>
        <AddOfferingDialog clientId={clientId} equipment={equipment} serviceTypes={serviceTypes} />
      </CardHeader>
      <CardContent>
        {equipment.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            Configure os equipamentos atendidos na aba <span className="font-medium">Equipamentos</span> antes de cadastrar serviços.
          </p>
        )}
        {offerings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offerings.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.equipmentName}</TableCell>
                  <TableCell>{o.serviceName}</TableCell>
                  <TableCell className="text-muted-foreground">{o.notes || "—"}</TableCell>
                  <TableCell>
                    <DeleteIconButton action={() => removeClientServiceOfferingAction(clientId, o.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
