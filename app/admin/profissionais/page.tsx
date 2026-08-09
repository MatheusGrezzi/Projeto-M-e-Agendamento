import { DeleteProfessionalButton } from "./delete-professional-button";
import { ProfessionalDialog } from "./professional-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { listProfessionals } from "@/services/professionals-repository";
import { listServices } from "@/services/services-repository";

export default async function ProfissionaisPage() {
  const supabase = await createClient();
  const [professionals, services] = await Promise.all([
    listProfessionals(supabase, { includeInactive: true }),
    listServices(supabase, { includeInactive: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Profissionais</h1>
        <ProfessionalDialog services={services} />
      </div>

      {professionals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.map((professional) => (
              <TableRow key={professional.id}>
                <TableCell className="font-medium">{professional.fullName}</TableCell>
                <TableCell>
                  <Badge variant={professional.active ? "default" : "secondary"}>{professional.active ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ProfessionalDialog professional={professional} services={services} />
                  <DeleteProfessionalButton id={professional.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
