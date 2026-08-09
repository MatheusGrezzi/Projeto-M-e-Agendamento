import { DeleteServiceButton } from "./delete-service-button";
import { ServiceDialog } from "./service-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDurationMinutes, formatPriceCents } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { listServices } from "@/services/services-repository";

export default async function ServicosPage() {
  const supabase = await createClient();
  const services = await listServices(supabase, { includeInactive: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
        <ServiceDialog />
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{formatDurationMinutes(service.durationMinutes)}</TableCell>
                <TableCell>{formatPriceCents(service.priceCents)}</TableCell>
                <TableCell>
                  <Badge variant={service.active ? "default" : "secondary"}>{service.active ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ServiceDialog service={service} />
                  <DeleteServiceButton id={service.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
