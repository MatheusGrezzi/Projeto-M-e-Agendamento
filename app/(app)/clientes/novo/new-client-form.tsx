"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createClientAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientCompanySchema } from "@/lib/validations/client";

type FormValues = z.input<typeof clientCompanySchema>;

export function NewClientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientCompanySchema, undefined, { raw: true }),
    defaultValues: { name: "", tradeName: "", cnpj: "", website: "", whatsapp: "", phone: "", email: "", businessHours: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createClientAction(values);
    if (result?.error) toast.error(result.error);
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input id="name" placeholder="Ex: Assistência Frio Fácil Ltda" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tradeName">Nome comercial</Label>
              <Input id="tradeName" placeholder="Ex: Frio Fácil" {...register("tradeName")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Site</Label>
              <Input id="website" placeholder="https://..." {...register("website")} />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" placeholder="(31) 99999-9999" {...register("whatsapp")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(31) 3333-3333" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="contato@empresa.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="primaryCity">Cidade principal</Label>
              <Input id="primaryCity" placeholder="Ex: Betim" {...register("primaryCity")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primaryState">Estado</Label>
              <Input id="primaryState" placeholder="Ex: MG" {...register("primaryState")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessHours">Horário de funcionamento</Label>
            <Input id="businessHours" placeholder="Ex: Seg a sex, 8h às 18h" {...register("businessHours")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" placeholder="Qualquer informação estratégica relevante sobre o cliente." {...register("notes")} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
