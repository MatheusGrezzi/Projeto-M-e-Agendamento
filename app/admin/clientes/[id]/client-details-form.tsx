"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";

import { updateClientDetailsAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateClientDetailsSchema } from "@/lib/validations/client";
import type { Profile } from "@/types";

type FormValues = z.input<typeof updateClientDetailsSchema>;

export function ClientDetailsForm({ client }: { client: Profile }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateClientDetailsSchema),
    // `values` (not `defaultValues`) keeps the form synced when `client`
    // changes after router.refresh() following a save — defaultValues only
    // applies once, on mount.
    values: {
      cpf: client.cpf ?? "",
      healthInsurance: client.healthInsurance ?? "",
      allergiesNotes: client.allergiesNotes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateClientDetailsAction(client.id, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dados do cliente atualizados.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="healthInsurance">Convênio</Label>
          <Input id="healthInsurance" placeholder="Ex: Unimed" {...register("healthInsurance")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="allergiesNotes">Alergias / observações clínicas</Label>
        <Textarea id="allergiesNotes" placeholder="Ex: alergia a anestésico X" {...register("allergiesNotes")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar dados do cliente"}
      </Button>
    </form>
  );
}
