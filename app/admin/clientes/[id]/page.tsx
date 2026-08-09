import { notFound } from "next/navigation";

import { ClientDetailsForm } from "./client-details-form";
import { ClientRecords } from "./client-records";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { listAppointmentsForClientWithDetails } from "@/services/booking/appointment-repository";
import { getClient, listClientRecords } from "@/services/clients-repository";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const client = await getClient(supabase, id);
  if (!client) notFound();

  const [appointments, records] = await Promise.all([
    listAppointmentsForClientWithDetails(supabase, id),
    listClientRecords(supabase, id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{client.fullName ?? "Cliente sem nome"}</h1>
        <p className="text-sm text-muted-foreground">{client.phone ?? "Telefone não informado"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
          <CardDescription>CPF, convênio e alergias — relevantes principalmente para clínicas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientDetailsForm client={client} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span>
                    {appointment.serviceName} com {appointment.professionalName}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(appointment.startsAt).toLocaleDateString("pt-BR")} · {appointment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prontuário</CardTitle>
          <CardDescription>Histórico clínico cumulativo — visível apenas para admin/atendente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientRecords clientId={client.id} records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
