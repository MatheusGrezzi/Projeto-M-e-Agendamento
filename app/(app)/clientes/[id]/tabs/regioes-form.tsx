"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createClientLocationAction, deleteClientLocationAction } from "../actions";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientLocationSchema } from "@/lib/validations/client-relations";
import type { ClientLocation, LocationPriority } from "@/types";

const PRIORITY_LABEL: Record<LocationPriority, string> = {
  muito_alta: "Muito alta",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

function AddLocationDialog({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientLocationSchema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientLocationSchema, undefined, { raw: true }),
    defaultValues: { city: "", state: "", neighborhood: "", priority: "", isServed: "true" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createClientLocationAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Região adicionada.");
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
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Nova região
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova região</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location-city">Cidade</Label>
              <Input id="location-city" {...register("city")} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location-state">Estado (UF)</Label>
              <Input id="location-state" maxLength={2} {...register("state")} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location-neighborhood">Bairro (opcional)</Label>
            <Input id="location-neighborhood" {...register("neighborhood")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={watch("isServed") !== "false"}
              onCheckedChange={(checked) => setValue("isServed", checked ? "true" : "false")}
            />
            <Label className="font-normal">Esta região é atendida</Label>
          </div>
          {watch("isServed") !== "false" && (
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={watch("priority") || ""} onValueChange={(v) => setValue("priority", v as FormValues["priority"])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as LocationPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

export function RegioesForm({ clientId, locations }: { clientId: string; locations: ClientLocation[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm">Regiões</CardTitle>
          <CardDescription>Cidades atendidas, com prioridade — e regiões explicitamente excluídas.</CardDescription>
        </div>
        <AddLocationDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma região cadastrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cidade</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.city}</TableCell>
                  <TableCell>{loc.state}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.neighborhood || "—"}</TableCell>
                  <TableCell>
                    {loc.isServed ? <Badge variant="secondary">Atende</Badge> : <Badge variant="destructive">Não atende</Badge>}
                  </TableCell>
                  <TableCell>{loc.priority ? PRIORITY_LABEL[loc.priority] : "—"}</TableCell>
                  <TableCell>
                    <DeleteIconButton action={() => deleteClientLocationAction(clientId, loc.id)} />
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
