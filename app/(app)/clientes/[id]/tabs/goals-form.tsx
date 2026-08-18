"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { updateClientGoalsAction, updateClientStatusAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientGoalsSchema } from "@/lib/validations/client";
import type { Client, ClientStatus } from "@/types";

type FormValues = z.input<typeof clientGoalsSchema>;

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "churned", label: "Encerrado" },
];

function StatusSelect({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          const result = await updateClientStatusAction(clientId, value as ClientStatus);
          if (result.error) toast.error(result.error);
          else router.refresh();
        });
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GoalsForm({ client }: { client: Client }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientGoalsSchema, undefined, { raw: true }),
    defaultValues: {
      dailyBudget: client.dailyBudget?.toString() ?? "",
      monthlyBudgetEstimate: client.monthlyBudgetEstimate?.toString() ?? "",
      averageTicket: client.averageTicket?.toString() ?? "",
      leadGoal: client.leadGoal?.toString() ?? "",
      cplGoal: client.cplGoal?.toString() ?? "",
      closedServicesGoal: client.closedServicesGoal?.toString() ?? "",
      cpaGoal: client.cpaGoal?.toString() ?? "",
      roasGoal: client.roasGoal?.toString() ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateClientGoalsAction(client.id, values);
    if (result.error) toast.error(result.error);
    else toast.success("Metas salvas.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusSelect clientId={client.id} status={client.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orçamento e metas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="dailyBudget">Orçamento diário (Google Ads)</Label>
                <Input id="dailyBudget" type="number" step="0.01" min={0} {...register("dailyBudget")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudgetEstimate">Orçamento mensal estimado</Label>
                <Input id="monthlyBudgetEstimate" type="number" step="0.01" min={0} {...register("monthlyBudgetEstimate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="averageTicket">Ticket médio</Label>
                <Input id="averageTicket" type="number" step="0.01" min={0} {...register("averageTicket")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="leadGoal">Meta de leads</Label>
                <Input id="leadGoal" type="number" min={0} {...register("leadGoal")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cplGoal">Meta de CPL</Label>
                <Input id="cplGoal" type="number" step="0.01" min={0} {...register("cplGoal")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closedServicesGoal">Meta de serviços fechados</Label>
                <Input id="closedServicesGoal" type="number" min={0} {...register("closedServicesGoal")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpaGoal">Meta de CPA</Label>
                <Input id="cpaGoal" type="number" step="0.01" min={0} {...register("cpaGoal")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="roasGoal">Meta de ROAS</Label>
                <Input id="roasGoal" type="number" step="0.01" min={0} {...register("roasGoal")} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
