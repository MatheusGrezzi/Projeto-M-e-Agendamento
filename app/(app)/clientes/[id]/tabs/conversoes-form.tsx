"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createClientConversionAction, deleteClientConversionAction } from "../actions";
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
import { clientConversionSchema } from "@/lib/validations/client-relations";
import type { ClientConversion, ConversionType } from "@/types";

const TYPE_LABEL: Record<ConversionType, string> = {
  whatsapp: "WhatsApp",
  call: "Ligação",
  form: "Formulário",
  booking: "Agendamento",
  purchase: "Compra",
  other: "Outro",
};

function AddConversionDialog({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof clientConversionSchema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientConversionSchema, undefined, { raw: true }),
    defaultValues: { name: "", platform: "", conversionType: "whatsapp", externalId: "", status: "active", isPrimary: "false", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createClientConversionAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Conversão adicionada.");
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
        Nova conversão
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova conversão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="conv-name">Nome</Label>
            <Input id="conv-name" placeholder="Ex: Clique no WhatsApp" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={watch("conversionType")} onValueChange={(v) => setValue("conversionType", v as ConversionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as ConversionType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conv-platform">Plataforma</Label>
              <Input id="conv-platform" placeholder="Google Ads, Meta..." {...register("platform")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conv-external-id">Identificador</Label>
            <Input id="conv-external-id" placeholder="ID da conversão na plataforma" {...register("externalId")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={watch("isPrimary") === "true"} onCheckedChange={(c) => setValue("isPrimary", c ? "true" : "false")} />
            <Label className="font-normal">Conversão primária</Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conv-notes">Observações</Label>
            <Input id="conv-notes" {...register("notes")} />
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

export function ConversoesForm({ clientId, conversions }: { clientId: string; conversions: ClientConversion[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm">Conversões</CardTitle>
          <CardDescription>Ações que contam como conversão para este cliente.</CardDescription>
        </div>
        <AddConversionDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        {conversions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma conversão cadastrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name} {c.isPrimary && <Badge className="ml-1.5">Primária</Badge>}
                  </TableCell>
                  <TableCell>{TYPE_LABEL[c.conversionType]}</TableCell>
                  <TableCell className="text-muted-foreground">{c.platform || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? "Ativa" : "Inativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    <DeleteIconButton action={() => deleteClientConversionAction(clientId, c.id)} />
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
