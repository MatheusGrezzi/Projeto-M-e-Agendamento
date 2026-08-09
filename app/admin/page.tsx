import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDateStringInTimezone } from "@/lib/booking/timezone";
import { companyConfig } from "@/lib/config/company-config";
import { createClient } from "@/lib/supabase/server";
import { listAppointmentsForStaffWithDetails } from "@/services/booking/appointment-repository";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = getDateStringInTimezone(new Date(), companyConfig.timezone);
  const appointments = await listAppointmentsForStaffWithDetails(supabase, { date: today });
  const confirmed = appointments.filter((a) => a.status === "confirmed");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <Card className="max-w-xs">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{confirmed.length}</p>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Agenda de hoje</h2>
          <Link href="/admin/agenda" className="text-sm font-medium text-primary hover:underline">
            Ver agenda completa
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">
                      {new Date(appointment.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} —{" "}
                      {appointment.serviceName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.clientName} com {appointment.professionalName}
                    </p>
                  </div>
                  <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>{appointment.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
