import { ServiceCard } from "@/components/site/service-card";
import { createClient } from "@/lib/supabase/server";
import { listServices } from "@/services/services-repository";

export default async function ServicosPage() {
  const supabase = await createClient();
  const services = await listServices(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Serviços</h1>
      {services.length === 0 ? (
        <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
