import Link from "next/link";

import { AgendaRow } from "./agenda-row";
import { ManualBookingDialog } from "./manual-booking-dialog";
import { getDateStringInTimezone } from "@/lib/booking/timezone";
import { companyConfig } from "@/lib/config/company-config";
import { createClient } from "@/lib/supabase/server";
import { listAppointmentsForStaffWithDetails } from "@/services/booking/appointment-repository";
import { listServices } from "@/services/services-repository";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data: dateParam } = await searchParams;
  const date = dateParam ?? getDateStringInTimezone(new Date(), companyConfig.timezone);

  const supabase = await createClient();
  const [appointments, services] = await Promise.all([
    listAppointmentsForStaffWithDetails(supabase, { date }),
    listServices(supabase),
  ]);

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <ManualBookingDialog services={services} />
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/admin/agenda?data=${prevDate}`} className="text-sm text-primary hover:underline">
          ← Dia anterior
        </Link>
        <span className="text-sm font-medium">{date.split("-").reverse().join("/")}</span>
        <Link href={`/admin/agenda?data=${nextDate}`} className="text-sm text-primary hover:underline">
          Próximo dia →
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum agendamento nesta data.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((appointment) => (
            <AgendaRow key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
