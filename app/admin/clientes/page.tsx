import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/services/clients-repository";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const clients = await listClients(supabase, q ?? "");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>

      <form className="max-w-sm">
        <Input name="q" defaultValue={q ?? ""} placeholder="Buscar por nome" />
      </form>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Convênio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/clientes/${client.id}`} className="hover:underline">
                    {client.fullName ?? "Cliente sem nome"}
                  </Link>
                </TableCell>
                <TableCell>{client.phone ?? "—"}</TableCell>
                <TableCell>{client.healthInsurance ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
