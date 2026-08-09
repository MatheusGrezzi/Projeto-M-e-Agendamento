import Link from "next/link";

import { AppointmentCard } from "../appointment-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listAppointmentsForClientWithDetails } from "@/services/booking/appointment-repository";

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appointments = user ? await listAppointmentsForClientWithDetails(supabase, user.id) : [];
  // This Server Component runs once per request (no client-side re-render to
  // go stale), so reading the current time here is safe despite the
  // react-compiler purity rule, which can't distinguish server from client components.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meus agendamentos</h1>
        <Button render={<Link href="/agendar" />} size="sm">
          Novo agendamento
        </Button>
      </div>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground">Você ainda não tem agendamentos.</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
