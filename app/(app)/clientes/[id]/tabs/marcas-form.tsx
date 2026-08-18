"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createCustomBrandAction, removeClientBrandAction, setClientBrandPolicyAction, setClientBrandStatusAction } from "../actions";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customBrandSchema } from "@/lib/validations/catalog";
import type { Brand, BrandStatus, Client, ClientBrandStatus } from "@/types";

function AddBrandDialog({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  type FormValues = z.input<typeof customBrandSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customBrandSchema, undefined, { raw: true }),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createCustomBrandAction(clientId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Marca criada.");
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
        Marca personalizada
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova marca</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Nome</Label>
            <Input id="brand-name" {...register("name")} />
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

function BrandStatusRow({ clientId, brand, current, onRemoved }: { clientId: string; brand: Brand; current?: ClientBrandStatus; onRemoved: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(status: BrandStatus) {
    startTransition(async () => {
      const result = await setClientBrandStatusAction(clientId, { brandId: brand.id, status });
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{brand.name}</TableCell>
      <TableCell>
        <Select value={current?.status ?? ""} disabled={isPending} onValueChange={(v) => setStatus(v as BrandStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Definir..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="served">Atendida</SelectItem>
            <SelectItem value="not_served">Não atendida</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-10">
        {current && <DeleteIconButton action={async () => { const r = await removeClientBrandAction(clientId, current.id); onRemoved(); return r; }} />}
      </TableCell>
    </TableRow>
  );
}

export function MarcasForm({ client, brands, statuses }: { client: Client; brands: Brand[]; statuses: ClientBrandStatus[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusByBrand = new Map(statuses.map((s) => [s.brandId, s]));

  function setPolicy(policy: "no_restriction" | "specific") {
    startTransition(async () => {
      const result = await setClientBrandPolicyAction(client.id, policy);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Política de marcas</CardTitle>
          <CardDescription>Por padrão, o cliente não tem restrição de marca.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={client.brandPolicy === "no_restriction" ? "default" : "outline"}
            disabled={isPending}
            onClick={() => setPolicy("no_restriction")}
          >
            Sem restrição de marca
          </Button>
          <Button
            type="button"
            size="sm"
            variant={client.brandPolicy === "specific" ? "default" : "outline"}
            disabled={isPending}
            onClick={() => setPolicy("specific")}
          >
            Definir marcas específicas
          </Button>
        </CardContent>
      </Card>

      {client.brandPolicy === "specific" && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Marcas</CardTitle>
              <CardDescription>Marque cada marca como atendida ou não atendida.</CardDescription>
            </div>
            <AddBrandDialog clientId={client.id} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              O uso de marcas em anúncios e palavras-chave deve respeitar as políticas do Google Ads.
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <BrandStatusRow key={brand.id} clientId={client.id} brand={brand} current={statusByBrand.get(brand.id)} onRemoved={() => router.refresh()} />
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {statuses
                .filter((s) => s.status === "not_served")
                .map((s) => (
                  <Badge key={s.id} variant="destructive">
                    Não atende: {s.brandName}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
