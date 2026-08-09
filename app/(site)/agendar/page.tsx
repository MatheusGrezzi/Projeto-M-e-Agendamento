import { BookingWizard } from "./booking-wizard";
import { createClient } from "@/lib/supabase/server";
import { listServices } from "@/services/services-repository";

export default async function AgendarPage({ searchParams }: { searchParams: Promise<{ servico?: string }> }) {
  const { servico } = await searchParams;
  const supabase = await createClient();
  const [services, { data }] = await Promise.all([listServices(supabase), supabase.auth.getUser()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Agendar horário</h1>
      {services.length === 0 ? (
        <p className="text-muted-foreground">Nenhum serviço disponível para agendamento no momento.</p>
      ) : (
        <BookingWizard services={services} isAuthenticated={Boolean(data.user)} initialServiceId={servico} />
      )}
    </div>
  );
}
