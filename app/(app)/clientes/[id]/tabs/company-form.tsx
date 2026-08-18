"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { updateClientCompanyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientCompanySchema } from "@/lib/validations/client";
import type { Client } from "@/types";

type FormValues = z.input<typeof clientCompanySchema>;

export function CompanyForm({ client }: { client: Client }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientCompanySchema, undefined, { raw: true }),
    defaultValues: {
      name: client.name,
      tradeName: client.tradeName ?? "",
      cnpj: client.cnpj ?? "",
      website: client.website ?? "",
      whatsapp: client.whatsapp ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      businessHours: client.businessHours ?? "",
      notes: client.notes ?? "",
      primaryCity: client.primaryCity ?? "",
      primaryState: client.primaryState ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateClientCompanyAction(client.id, values);
    if (result.error) toast.error(result.error);
    else toast.success("Dados da empresa salvos.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tradeName">Nome comercial</Label>
              <Input id="tradeName" {...register("tradeName")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" {...register("cnpj")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Site</Label>
              <Input id="website" {...register("website")} />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...register("whatsapp")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="primaryCity">Cidade principal</Label>
              <Input id="primaryCity" {...register("primaryCity")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primaryState">Estado</Label>
              <Input id="primaryState" {...register("primaryState")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessHours">Horário de funcionamento</Label>
            <Input id="businessHours" {...register("businessHours")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
