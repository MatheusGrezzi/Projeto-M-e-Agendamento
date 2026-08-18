"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createClientLandingPageAction, deleteClientLandingPageAction } from "../actions";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientLandingPageSchema } from "@/lib/validations/client-relations";
import type { ClientLandingPage, Equipment, Segment, ServiceType } from "@/types";

function AddLandingPageDialog({
  clientId,
  segments,
  equipment,
  serviceTypes,
}: {
  clientId: string;
  segments: Segment[];
  equipment: Equipment[];
  serviceTypes: ServiceType[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientLandingPageSchema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientLandingPageSchema, undefined, { raw: true }),
    defaultValues: { name: "", url: "", segmentId: "", equipmentId: "", serviceId: "", city: "", status: "active" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createClientLandingPageAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Landing page adicionada.");
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
        Nova landing page
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova landing page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lp-name">Nome</Label>
            <Input id="lp-name" placeholder="Ex: Conserto de Geladeira Betim" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-url">URL</Label>
            <Input id="lp-url" placeholder="https://..." {...register("url")} />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Segmento</Label>
              <Select value={watch("segmentId") || ""} onValueChange={(v) => setValue("segmentId", v as string)}>
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lp-city">Cidade</Label>
              <Input id="lp-city" {...register("city")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Equipamento</Label>
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
              <Label>Serviço</Label>
              <Select value={watch("serviceId") || ""} onValueChange={(v) => setValue("serviceId", v as string)}>
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
            </div>
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

export function LandingPagesForm({
  clientId,
  segments,
  equipment,
  serviceTypes,
  pages,
}: {
  clientId: string;
  segments: Segment[];
  equipment: Equipment[];
  serviceTypes: ServiceType[];
  pages: ClientLandingPage[];
}) {
  const segmentLabel = new Map(segments.map((s) => [s.id, s.label]));
  const equipmentName = new Map(equipment.map((e) => [e.id, e.name]));
  const serviceName = new Map(serviceTypes.map((s) => [s.id, s.name]));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm">Landing Pages</CardTitle>
          <CardDescription>Páginas usadas pelas campanhas deste cliente.</CardDescription>
        </div>
        <AddLandingPageDialog clientId={clientId} segments={segments} equipment={equipment} serviceTypes={serviceTypes} />
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma landing page cadastrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Equipamento / Serviço</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      {p.name}
                      <ExternalLink className="size-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[p.equipmentId && equipmentName.get(p.equipmentId), p.serviceId && serviceName.get(p.serviceId)]
                      .filter(Boolean)
                      .join(" · ") || (p.segmentId ? segmentLabel.get(p.segmentId) : "—")}
                  </TableCell>
                  <TableCell>{p.city || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {p.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DeleteIconButton action={() => deleteClientLandingPageAction(clientId, p.id)} />
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
