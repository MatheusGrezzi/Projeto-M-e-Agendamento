import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrencyBRL } from "@/lib/format";
import { listClients } from "@/services/clients-repository";
import { getMyOrganization } from "@/services/organizations-repository";

export default async function ClientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getMyOrganization(supabase, user.id);
  if (!org) redirect("/login");

  const clients = await listClients(supabase, org.id);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} ${clients.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}`}
        action={
          <Button render={<Link href="/clientes/novo" />}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
            <Button render={<Link href="/clientes/novo" />} size="sm">
              <Plus className="size-4" />
              Cadastrar o primeiro cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Segmentos</TableHead>
                <TableHead>Cidade principal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orçamento diário</TableHead>
                <TableHead>Última atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/clientes/${c.id}`} className="hover:underline">
                      {c.tradeName || c.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.segments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        c.segments.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.primaryCity || "—"}</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>{c.dailyBudget != null ? formatCurrencyBRL(c.dailyBudget) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
